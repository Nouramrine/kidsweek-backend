const express = require("express");
const router = express.Router();
const Invite = require("../models/invites");
const authMiddleware = require("../middleware/auth");
const uid2 = require('uid2');
const { sendInvite } = require('../modules/mailer');

//Récupérer toutes les zones du membre connecté
router.get("/", authMiddleware, async (req, res) => {
  try {
    const invites = await Invite.find({ $or: { inviter: req.member._id, invited: req.member._id }});
    res.json({ result: true, invites });
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
        invite = await sendInvite(invite);
        res.json({ result: true, invites: invite });
    } catch (err) {
        res.status(500).json({ result: false, error: err.message });
    }
});

module.exports = router;