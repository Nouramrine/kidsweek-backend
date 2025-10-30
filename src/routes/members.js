const express = require("express");
const router = express.Router();

const Member = require("../models/members");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

// Add member

router.post("/", (req, res) => {
  if (!checkBody(req.body, ["firstName", "lastName", "isChildren"])) {
    res.json({ result: false, error: "Champs manquants ou vides" });
    return;
  }
  const { firstName, lastName, isChildren } = req.body
  const newMember = new Member({
    firstName,
    lastName,
    isChildren,
  });
  newMember.save().then((data) => {
    const { firstName, lastName, isChildren } = data
    res.json({ result: true, member: { firstName, lastName, isChildren } });
  });
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
