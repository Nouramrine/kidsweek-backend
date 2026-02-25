const Brevo = require("@getbrevo/brevo");

const getApiInstance = () => {
  const apiInstance = new Brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY,
  );
  return apiInstance;
};

const sendMail = async ({ to, subject, html, text }) => {
  try {
    const apiInstance = getApiInstance();
    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || "KidsWeek",
      email: process.env.BREVO_SENDER_EMAIL,
    };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.textContent = text;

    const info = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return { result: true, message: "Email envoyé", info };
  } catch (err) {
    console.error("Erreur Brevo:", err?.response?.body || err.message);
    return {
      result: false,
      error: err.message || "Erreur lors de l'envoi du mail",
    };
  }
};

const sendInvite = async (invite) => {
  const { inviter, email, url } = invite;
  const inviterName = `${inviter.firstName} ${inviter.lastName || ""}`.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border-radius: 8px; border: 1px solid #eee;">
      <h2 style="color: #4A90D9;">Vous avez une invitation KidsWeek 🎉</h2>
      <p>Bonjour,</p>
      <p><strong>${inviterName}</strong> vous invite à le rejoindre sur <strong>KidsWeek</strong> pour gérer les activités en famille.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${url}" 
           style="background-color: #4A90D9; color: white; padding: 14px 28px; 
                  border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold;">
          Accepter l'invitation
        </a>
      </div>
      <p style="color: #999; font-size: 12px;">
        Ce lien est valable 7 jours. Si vous n'attendiez pas cette invitation, vous pouvez ignorer ce mail.
      </p>
    </div>
  `;

  const text = `${inviterName} vous invite à rejoindre KidsWeek. Rendez-vous sur : ${url}`;

  return sendMail({
    to: email,
    subject: "KidsWeek - Vous avez une invitation",
    html,
    text,
  });
};

async function sendResetPasswordEmail(email, link) {
  return sendMail({
    to: email,
    subject: "Réinitialisation de votre mot de passe",
    html: `
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous :</p>
      <a href="${link}">${link}</a>
      <p>Ce lien expire dans 30 minutes.</p>
    `,
  });
}

module.exports = { sendInvite, sendResetPasswordEmail };
