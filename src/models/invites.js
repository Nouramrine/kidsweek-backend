const mongoose = require("mongoose");
const { Schema } = mongoose;
const uid2 = require('uid2');
const cron = require('node-cron');

const inviteSchema = new Schema({
  inviter: { type: Schema.Types.ObjectId, ref: 'members', required: true },
  invited: { type: Schema.Types.ObjectId, ref: 'members', required: true },
  email: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'expired' ], default: 'pending'},
  token: { type: String, default: uid2(32) },
  invitedAt: { type: Date, default: Date.now },
  expiresAt: { 
    type: Date, 
    default: () => {
      const date = new Date();
      date.setDate(date.getDate() + 7); // Ajoute 7 jours
      return date;
    }
  }
});

const Invite = mongoose.model("invites", inviteSchema);

// Vérifier toutes les heures les invitations expirées
cron.schedule('0 * * * *', async () => {
  try {
    await Invite.updateMany(
      { 
        status: 'pending',
        expiresAt: { $lt: new Date() }
      },
      { 
        status: 'expired' 
      }
    );
    console.log('Invitations expirées mises à jour');
  } catch (err) {
    console.error('Erreur mise à jour invitations:', err);
  }
});

module.exports = Invite;
