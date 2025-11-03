const Zone = require("../models/zones");
const mongoose = require('mongoose');

const getZones = async ( authMemberId, zoneId = null ) => {
  const memberObjectId = new mongoose.Types.ObjectId(authMemberId);
  const matchFilter = zoneId
    ? { _id: new mongoose.Types.ObjectId(zoneId) } // Filtrer une seule zone
    : { authorizations: { $elemMatch: { member: memberObjectId } } }; // Toutes les zones où le membre est autorisé

  const zones = await Zone.aggregate([
      // Filtrer les zones où le membre a une autorisation
      { $match: matchFilter },
      // Lookup pour peupler les membres
      {
        $lookup: {
          from: "members",
          localField: "authorizations.member",
          foreignField: "_id",
          as: "members"
        }
      },
      // Retirer les membres null (si un membre a été supprimé)
      {
        $addFields: {
          members: {
            $filter: { input: "$members", cond: { $ne: ["$$this", null] } }
          }
        }
      },
      // Ajouter authLevel pour le membre donné
      {
        $addFields: {
          authLevel: {
            $let: {
              vars: {
                authEntry: {
                  $arrayElemAt: [
                    { 
                      $filter: { 
                        input: "$authorizations", 
                        cond: { $eq: ["$$this.member", memberObjectId] } 
                      } 
                    }, 
                    0
                  ]
                }
              },
              in: "$$authEntry.level"
            }
          }
        }
      },
      // Ajouter le niveau d'autorisation pour chaque membre
      {
        $addFields: {
          members: {
            $map: {
              input: "$members",
              as: "m",
              in: {
                $mergeObjects: [
                  "$$m",
                  {
                    authLevel: {
                      $let: {
                        vars: {
                          authEntry: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$authorizations",
                                  cond: { $eq: ["$$this.member", "$$m._id"] }
                                }
                              },
                              0
                            ]
                          }
                        },
                        in: "$$authEntry.level"
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      }
    ])
  return zones;
}

module.exports = getZones;
