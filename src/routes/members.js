const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Member = require("../models/members");
const Invite = require("../models/invites");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const { sendResetPasswordEmail } = require("../modules/mailer");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client();
// ─── Créer un membre ─────────────────────────────────────────────────────────

router.post("/", authMiddleware, (req, res) => {
  if (!checkBody(req.body, ["firstName", "lastName", "color"])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }
  const memberId = req.member._id;
  const { firstName, lastName, color, isChildren } = req.body;

  const newMember = new Member({
    firstName,
    lastName,
    isChildren,
    color,
    authorizations: [{ member: memberId, level: "admin" }],
  });
  newMember.save().then((data) => {
    res.json({ result: true, member: data });
  });
});

// ─── Récupérer les membres (zones + autorisations) ───────────────────────────

router.get("/", authMiddleware, async (req, res) => {
  try {
    const memberId = req.member._id;
    const members = await Member.aggregate([
      { $match: { "authorizations.member": memberId } },
      {
        $unionWith: {
          coll: "zones",
          pipeline: [
            { $match: { "authorizations.member": memberId } },
            {
              $project: {
                userIds: {
                  $map: {
                    input: "$authorizations",
                    as: "auth",
                    in: "$$auth.member",
                  },
                },
              },
            },
            { $unwind: "$userIds" },
            {
              $lookup: {
                from: "members",
                localField: "userIds",
                foreignField: "_id",
                as: "member",
              },
            },
            { $unwind: "$member" },
            { $replaceRoot: { newRoot: "$member" } },
          ],
        },
      },
      {
        $group: {
          _id: "$_id",
          doc: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$doc" } },
      {
        $addFields: {
          authLevel: {
            $let: {
              vars: {
                auth: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$authorizations",
                        as: "a",
                        cond: { $eq: ["$$a.member", memberId] },
                      },
                    },
                    0,
                  ],
                },
              },
              in: "$$auth.level",
            },
          },
          isCurrent: { $eq: ["$_id", memberId] },
        },
      },
      {
        $sort: {
          isChildren: 1,
          authLevel: -1,
        },
      },
    ]);
    res.json({ result: true, members });
  } catch (err) {
    res.json({ result: false, message: err.message });
  }
});

// ─── Routes statiques  ─────────────────────

// Sauvegarder le token push
router.put("/push-token", authMiddleware, async (req, res) => {
  try {
    const { pushToken } = req.body;
    const memberId = req.member._id;

    if (!pushToken) {
      return res.json({ result: false, error: "Token manquant" });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res
        .status(404)
        .json({ result: false, error: "Membre non trouvé" });
    }

    member.pushToken = pushToken;
    await member.save();

    res.json({ result: true, message: "Token enregistré" });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

// Dismiss tutorial tooltip
router.put("/tutorial/dismiss", authMiddleware, async (req, res) => {
  try {
    const { tooltipId } = req.body;
    if (!tooltipId) {
      return res.json({ result: false, error: "tooltipId manquant" });
    }
    const memberId = req.member._id;
    const member = await Member.findById(memberId);

    if (!member) {
      return res
        .status(404)
        .json({ result: false, error: "Membre non trouvé" });
    }

    if (!member.tutorialState) {
      member.tutorialState = new Map();
    }
    let dismissedTooltips = member.tutorialState.get("dismissedTooltips") || [];
    if (!dismissedTooltips.includes(tooltipId)) {
      dismissedTooltips.push(tooltipId);
      member.tutorialState.set("dismissedTooltips", dismissedTooltips);
      await member.save();
    }
    res.json({
      result: true,
      tutorialState: Object.fromEntries(member.tutorialState),
    });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

// Get tutorial state
router.get("/tutorial/state", authMiddleware, async (req, res) => {
  try {
    const memberId = req.member._id;
    const member = await Member.findById(memberId);

    if (!member) {
      return res
        .status(404)
        .json({ result: false, error: "Membre non trouvé" });
    }
    const tutorialState = member.tutorialState || new Map();

    res.json({
      result: true,
      tutorialState: Object.fromEntries(tutorialState),
    });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

// Signup
router.post("/signup", async (req, res) => {
  if (
    !checkBody(
      req.body,
      ["firstName", "lastName", "email", "password"],
      ["email"],
    )
  ) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }
  const { firstName, lastName, email, inviteToken, password } = req.body;
  try {
    const existingMember = await Member.findOne({ email });

    if (existingMember && !inviteToken) {
      return res.json({ result: false, error: "L'utilisateur existe déjà" });
    }

    let invite = null;
    let savedMember = null;
    if (inviteToken) {
      invite = await Invite.findOne({
        token: inviteToken,
        status: "pending",
      }).populate("inviter");
      if (!invite) {
        return res.json({
          result: false,
          error: "Erreur de récupération de l'invitation",
        });
      }
      const member = await Member.findById(invite.invited._id);
      const hash = bcrypt.hashSync(password, 10);
      member.firstName = firstName;
      member.lastName = lastName;
      member.email = email;
      member.password = hash;
      member.type = "auth";
      member.token = uid2(32);
      savedMember = await member.save();
      if (savedMember && invite) {
        await Invite.findByIdAndUpdate(invite._id, { status: "accepted" });
      } else {
        return res.json({ result: false, error: "Erreur de maj du membre" });
      }
    } else {
      const hash = bcrypt.hashSync(password, 10);
      const newMember = new Member({
        firstName,
        lastName,
        email,
        password: hash,
        token: uid2(32),
      });
      savedMember = await newMember.save();
    }

    const {
      firstName: fName,
      lastName: lName,
      email: memberEmail,
      token,
    } = savedMember;
    res.json({
      result: true,
      member: { firstName: fName, lastName: lName, email: memberEmail, token },
    });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

// Signin
router.post("/signin", async (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }

  try {
    const data = await Member.findOne({ email: req.body.email });

    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      if (!data.tutorialState) {
        data.tutorialState = new Map([["dismissedTooltips", []]]);
        await data.save();
      }

      const memberData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        token: data.token,
        tutorialState: Object.fromEntries(data.tutorialState),
      };
      res.json({ result: true, member: memberData });
    } else {
      res.json({ result: false, error: "Utilisateur introuvable" });
    }
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

// ─── Forgot Password ─────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({ result: false, error: "Email requis" });
  }

  try {
    const member = await Member.findOne({ email });
    if (!member) {
      return res.json({ result: true });
    }

    const resetToken = uid2(32);
    const expiration = Date.now() + 1000 * 60 * 30;

    member.resetPasswordToken = resetToken;
    member.resetPasswordExpires = expiration;
    await member.save();

    const resetLink = `kidsweek://reset-password?token=${resetToken}`;

    await sendResetPasswordEmail(member.email, resetLink);

    res.json({ result: true });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

// ─── Reset Password ─────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.json({ result: false, error: "Données manquantes" });
  }

  try {
    const member = await Member.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!member) {
      return res.json({ result: false, error: "Token invalide ou expiré" });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    member.password = hash;
    member.resetPasswordToken = null;
    member.resetPasswordExpires = null;
    await member.save();

    res.json({ result: true });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

//Connexion via google

router.post("/google-auth", async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.json({ result: false, error: "Token manquant" });

  try {
    const ticket = await client.verifyIdToken({ idToken });
    const payLoad = ticket.getPayload();

    const { email, given_name: firstName, family_name: lastName } = payLoad;

    let member = await Member.findOne({ email });

    if (!member) {
      member = new Member({
        firstName,
        lastName,
        email,
        type: "auth",
        token: uid2(32),
      });
      await member.save();
    }
    if (!member.token) {
      member.token = uid2(32);
      await member.save();
    }

    if (!member.tutorialState) {
      member.tutorialState = new Map([["dismissedTooltips", []]]);
      await member.save();
    }

    res.json({
      result: true,
      member: {
        firstName: member.firstName,
        lastName: member.lastName,
        emil: member.email,
        token: member.token,
        tutorialState: Object.fromEntries(member.tutorialState),
      },
    });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

// ─── Routes dynamiques ──────────────────────────

// Modifier un membre
router.put("/:memberId", authMiddleware, async (req, res) => {
  try {
    const { memberId } = req.params;
    const { firstName, lastName, color, isChildren, avatar } = req.body;

    const member = await Member.findById(memberId);
    if (!member) {
      return res
        .status(404)
        .json({ result: false, message: "Membre non trouvé." });
    }
    if (firstName) member.firstName = firstName;
    if (lastName) member.lastName = lastName;
    if (color) member.color = color;
    if (avatar) member.avatar = avatar;
    member.isChildren = isChildren ? true : false;

    await member.save();
    res.json({ result: true, message: "Membre mise à jour.", member });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
});

// Supprimer un membre
router.delete("/:memberId", authMiddleware, async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const deletedMember = await Member.findByIdAndDelete(memberId);
    if (!deletedMember) {
      return res
        .status(404)
        .json({ result: false, error: "Membre non trouvé." });
    }
    res.json({ result: true, member: deletedMember });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

// Récupérer un membre par email
router.get("/:email", async (req, res) => {
  const email = req.params.email;
  if (!email) {
    return res.json({ result: false, message: "Email manquant !" });
  }
  try {
    const member = await Member.findOne({ Email: email });
    if (member) {
      const { Password, ...memberData } = member.toObject();
      res.json({ result: true, member: memberData });
    } else {
      res.json({ result: false, message: "Utilisateur introuvable" });
    }
  } catch (err) {
    res.json({ result: false, message: err.message });
  }
});

module.exports = router;
