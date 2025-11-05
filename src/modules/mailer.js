import nodemailer from "nodemailer";

const sendMail = async (emailData) => {
  const { to, subject, text, html } = emailData;
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },

      tls: {
        rejectUnauthorized: false,
      },
      logger: true,
      debug: true,
    });
    console.log("🔄 Test de connexion...");
    await transporter.verify();
    console.log("✅ Connexion réussie !");

    await transporter.verify();
    console.log("Connexion SMTP établie");

    /* const mailOptions = {
      from: '"KidsWeek" <9ad624001@smtp-brevo.com>',
      to, // destinataire
      subject, // sujet
      text, // texte brut
      html, // optionnel : contenu HTML
    };*/

    // 3. Envoyer le mail

    const info = await transporter.sendMail({
      from: '"KidsWeek" <aurelien05@gmail.com>',
      to, // destinataire
      subject, // sujet
      text, // texte brut
      html,
    });
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
