const express = require("express");
const router = express.Router();

require("../models/connection");
const Member = require("../models/members");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

//Signup

router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["Firstname", "Lastname", "Email"])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }
  Member.findOne({ Email: req.body.Email }).then((data) => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.Password, 10);
      const newMember = new Member({
        Firstname: req.body.Firstname,
        Lastname: req.body.Lastname,
        Email: req.body.Email,
        Password: hash,
        Token: uid2(32),
      });
      newMember.save().then(() => {
        res.json({ result: true, Token: newMember.Token });
      });
    } else {
      res.json({ result: false, error: "L'utilisateur existe déjà" });
    }
  });
});

// Signin

router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["Email", "Password"])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }
  Member.findOne({
    Email: req.body.Email,
  }).then((data) => {
    if (data && bcrypt.compareSync(req.body.Password, data.Password)) {
      res.json({ result: true, Token: data.Token });
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
      res.json({ result: true, member: member });
    } else {
      res.json({ result: false, message: "Utilisateur introuvable" });
    }
  } catch (err) {
    res.json({ result: false, message: err.message });
  }
});

module.exports = router;
