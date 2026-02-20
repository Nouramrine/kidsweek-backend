const express = require("express");
const router = express.Router();
const Invite = require("../models/invites");
const authMiddleware = require("../middleware/auth");
const uid2 = require("uid2");
const { sendInvite } = require("../modules/mailer");

//Récupérer toutes les invitations
router.get("/", authMiddleware, async (req, res) => {
  try {
    const invites = await Invite.find({
      $or: [{ inviter: req.member._id }, { invited: req.member._id }],
    })
      .populate("inviter")
      .populate("invited")
      .lean();
    res.json({ result: true, invites });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

//Vérifier un token
router.get("/:token", async (req, res) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token });

    if (!invite) {
      return res.json({ result: false, error: `Le token n'existe pas` });
    }

    // Vérifier si l'invitation a expiré
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return res.json({ result: false, error: `Le token a expiré` });
    }

    // Vérifier si l'invitation a déjà été utilisée
    if (invite.status !== "pending") {
      return res.json({ result: false, error: `Le token a déjà été utilisé` });
    }

    res.json({
      result: true,
      invite: {
        token: invite.token,
        invitedId: invite.invited._id,
        emailAddress: invite.emailAddress,
        createdAt: invite.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

// créer / regenérer une invitation
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { invitedId, emailAddress } = req.body;
    let invite = await Invite.findOne({
      inviter: req.member._id.toString(),
      invited: invitedId,
    })
      .populate("inviter")
      .populate("invited");
    if (invite) {
      invite.email = emailAddress;
      invite.token = uid2(32);
      await invite.save();
    } else {
      invite = new Invite({
        inviter: req.member._id,
        invited: invitedId,
        email: emailAddress,
        token: uid2(32),
      });
      await invite.save();
    }
    res.json({ result: true, invites: invite });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

// envoyer une invitation par mail
router.post("/send", authMiddleware, async (req, res) => {
  console.log("📧 === ROUTE /invites/send APPELÉE ===");
  console.log("📦 Body reçu:", req.body);

  try {
    const { inviteId, url } = req.body;

    const invite = await Invite.findById(inviteId)
      .populate("inviter")
      .populate("invited");

    console.log("🔍 Invitation trouvée:", invite ? "✅" : "❌");

    if (!invite) {
      return res.json({ result: false, error: "Invitation introuvable" });
    }
    if (invite.status !== "pending") {
      return res.json({
        result: false,
        error: "Cette invitation n'est plus active",
      });
    }
    if (invite.inviter._id.toString() !== req.member._id.toString()) {
      return res.status(403).json({ result: false, error: "Non autorisé" });
    }

    console.log("📨 Envoi du mail à:", invite.email);
    const mailing = await sendInvite({ ...invite.toObject(), url });
    console.log("✉️ Résultat envoi:", mailing);

    if (mailing.result) {
      res.json({ result: true, invite });
    } else {
      res.json({ result: false, error: "Échec de l'envoi du mail" });
    }
  } catch (err) {
    console.error("❌ Erreur route /invites/send:", err);
    res.status(500).json({ result: false, error: err.message });
  }
});
module.exports = router;
