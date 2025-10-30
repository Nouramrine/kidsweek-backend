const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Member = require("../models/members");
const Zone = require("../models/zones");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

// Add member

router.post("/", authMiddleware, (req, res) => {
  if (!checkBody(req.body, ["firstName", "lastName", "isChildren"])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }
  const memberId = req.member._id;
  const { firstName, lastName, isChildren } = req.body
  const newMember = new Member({
    firstName,
    lastName,
    isChildren,
    creator : memberId,
  });
  newMember.save().then((data) => {
    const { firstName, lastName, isChildren } = data
    res.json({ result: true, member: { firstName, lastName, isChildren } });
  });
});

// Get members from zone and created by

router.get("/", authMiddleware, async (req, res) => {
  try {
    const memberId = req.member._id;
    const members = await Member.aggregate([
      // Étape 1 : récupérer les utilisateurs créés par userId
      { $match: { creator: memberId } },
      { $unionWith: { coll: "zones", pipeline: [
        { // Étape 2 : zones où on est owner ou membre
          $match: { $or: [ { owner: memberId }, { members: memberId } ]}
        },
        { // Étape 3 : récupérer tous les IDs des membres et de l’owner
          $project: { 
            userIds: { 
              $setUnion: [
                { $ifNull: ["$members", []] },
                [{ $ifNull: ["$owner", null] }]
              ]
            }
          }
        },
        { $unwind: "$userIds" }, // on déplie pour avoir un document par userId
          { // Étape 4 : récupérer les documents User correspondant
            $lookup: {
              from: "members",
              localField: "memberIds",
              foreignField: "_id",
              as: "member"
            }
          },
          { $unwind: "$member" },
          { $replaceRoot: { newRoot: "$member" } } // on remplace pour ne garder que le document User
      ]}},
      { // Étape 5 : enlever les doublons
        $group: {
          _id: "$_id",
          doc: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$doc" } }
    ]);
    console.log(members)
    res.json({ result: true, members });
  } catch (err) {
    res.json({ result: false, message: err.message });
  }
});

// Modifier un membre

router.put("/:memberId", authMiddleware, async (req, res) => {
  try {
    const { memberId } = req.params;
    const { firstName, lastName, isChildren } = req.body;

    const member = await Member.findById(memberId);
    if (!member) {
      return res
        .status(404)
        .json({ result: false, message: "Membre non trouvé." });
    }
    if (firstName) member.firstName = firstName;
    if (lastName) member.lastName = lastName;
    if (isChildren) member.isChildren = isChildren;

    await member.save();
    res.json({ result: true, message: "Membre mise à jour.", member });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
});


// delete member

router.delete("/:memberId", authMiddleware, async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const deletedMember = await Member.findByIdAndDelete(memberId);
    if (!deletedMember) {
      return res.status(404).json({ result: false, error: "Membre non trouvé." });
    }
    res.json({ result: true, member: deletedMember });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

//Signup

router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["firstName", "lastName", "email", "password"], ['email'])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }
  const { firstName, lastName, email, password } = req.body
  Member.findOne({ email }).then((data) => {
    if (data === null) {
      const hash = bcrypt.hashSync(password, 10);
      const newMember = new Member({
        firstName,
        lastName,
        email,
        password: hash,
        token: uid2(32),
      });
      
      newMember.save().then((data) => {
        const { firstName, lastName, email, token } = data
        res.json({ result: true, member: { firstName, lastName, email, token } });
      });
    } else {
      res.json({ result: false, error: "L'utilisateur existe déjà" });
    }
  });
});

// Signin

router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["email", "password"], ['email'])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }
  Member.findOne({
    email: req.body.email,
  }).then((data) => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      const memberData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        token: data.token,
      };
      res.json({ result: true, member: memberData });
    } else {
      res.json({ result: false, error: "Utilisateur introuvable" });
    }
  });
});

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
