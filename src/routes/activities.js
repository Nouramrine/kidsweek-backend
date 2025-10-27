const express = require("express");
const router = express.Router();
const Activity = require("../models/activities");
const Member = require("../models/members");
const authMiddleware = require("../middleware/auth");

//Récupérer les prochaines activités d'un membre
router.get("/", authMiddleware, async (req, res) => {
  try {
    const memberId = req.member._id;
    const now = new Date();

    const activities = await Activity.find({
      members: memberId,
      dateBegin: { $gte: now },
    })
      .populate("members", "fistName lastName email")
      .populate("owner", "fistName lastName email")
      .sort({ dateBegin: 1 });
    res.json({ result: true, activities });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
});

module.exports = router;
