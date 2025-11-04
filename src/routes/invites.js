const express = require("express");
const router = express.Router();
const Invite = require("../models/invites");
const authMiddleware = require("../middleware/auth");
const uid2 = require('uid2');
const { sendInvite } = require('../modules/mailer');

//Récupérer toutes les invitations
router.get("/", authMiddleware, async (req, res) => {
  try {
    const invites = await Invite.find({ $or: { inviter: req.member._id, invited: req.member._id }});
    res.json({ result: true, invites });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

//Vérifier un token
router.get("/:token", async (req, res) => {
  try {
    const invites = await Invite.findOne({ token: req.params.token });
    if(token) {
        res.json({ result: true, invites });
    } else {
        res.json({ result: false, error: `Le token n'existe pas` });
    }
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { invitedId, emailAddress } = req.body;
        let invite = await Invite.findOne({
            inviter: req.member._id.toString(),
            invited: invitedId
        }).populate('inviter').populate('invited');
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
        const mailing = await sendInvite(invite);
        if(mailing.result) {
            res.json({ result: true, invites: invite });
        } else {
            res.json({ result: false, error: 'Echec mail' });
        }
    } catch (err) {
        res.status(500).json({ result: false, error: err.message });
    }
});

module.exports = router;