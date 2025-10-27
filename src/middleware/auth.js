const Member = require("../models/members");

async function authMiddleware(req, res, next) {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res
        .status(401)
        .json({ result: false, message: "Token manquant !" });
    }
    //recherche du membre correspondant au token
    const member = await Member.findOne({ token: token });
    if (!member) {
      return res
        .status(401)
        .json({ result: false, message: "Token invalide !" });
    }
    // on attache le membre à la requête pour les routes
    req.member = member;
    next();
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
}

module.exports = authMiddleware;
