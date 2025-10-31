const Zone = require("../models/zones");

const getPopulatedZone = async (authMemberId, zone) => {
    // Renvoi de la zone avec populate
    const populatedZone = await Zone.findById(zone._id)
      .populate("members")
      .lean();

    // Ajout de vérification des droits de modification
    populatedZone.isReadOnly = zone.owner.toString() === authMemberId.toString() ? false : true;

    return populatedZone;
}

module.exports = getPopulatedZone;
