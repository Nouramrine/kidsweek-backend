import nodemailer from "nodemailer";

const sendMail = async (emailData) => {
  const { to, subject, text, html } = emailData;
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      type: "OAuth2",
      secure: true,
      auth: {
        user: "vincent@assomption-mediterranee.net",
        pass: "wegp scwp ulok nsrb",
      },
    });

    const mailOptions = {
      from: '"KidsWeek" <kidsweek@free.fr>',
      to, // destinataire
      subject, // sujet
      text, // texte brut
      html, // optionnel : contenu HTML
    };

    // 3. Envoyer le mail
    const info = await transporter.sendMail(mailOptions);
    return { result: true, message: "Email envoyé", info };
  } catch (err) {
    console.error(err);
    return { result: false, error: err || `Erreur lors de l'envoi du mail` };
  }
};

export const sendInvite = async (invite) => {
  const inviteMailData = {
    to: invite.email,
    subject: `KidsWeek - Nouvelle invitation`,
    text: `${invite.inviter.lastName} ${invite.inviter.firstName} vous invite à le rejoindre sur KidsWeek.
        Rendez-vous sur ce lien : ${invite.url}`,
    html: `<p>${invite.inviter.lastName} ${invite.inviter.firstName} vous invite à le rejoindre sur KidsWeek.
        Rendez-vous sur ce lien : ${invite.url}`,
  };
  const mailer = await sendMail(inviteMailData);
  if (mailer.result) {
    return { result: true, mailer };
  }
  return { result: false, error: mailer.error };
};
