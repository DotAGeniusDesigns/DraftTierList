// Transactional email via Resend's REST API.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const EMAIL_TIMEOUT_MS = 8_000;

const isProduction = process.env.VERCEL_ENV === 'production';
const configuredFromAddress = process.env.EMAIL_FROM;
if (isProduction && (
    !configuredFromAddress || configuredFromAddress.includes('onboarding@resend.dev')
)) {
    throw new Error('EMAIL_FROM must use a verified Resend domain in production.');
}
const FROM_ADDRESS = configuredFromAddress || 'Fantasy Toolkit <onboarding@resend.dev>';
const APP_NAME = String(process.env.APP_NAME || 'Fantasy Toolkit').replace(/[\r\n]/g, ' ').trim();

const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const sendEmail = async ({ to, subject, html, text }) => {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        if (isProduction) {
            throw new Error('RESEND_API_KEY is not set; refusing to drop a production email.');
        }
        console.info(`[email:dev] To: ${to}\nSubject: ${subject}\n\n${text}`);
        return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);
    let response;
    try {
        response = await fetch(RESEND_ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html, text }),
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Resend rejected the message (${response.status}): ${detail}`);
    }
};

const layout = (heading, bodyHtml) => `
<div style="background:#f1f5f9;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e2e8f0;">
    <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#10b981;">${escapeHtml(APP_NAME)}</p>
    <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:#0f172a;">${escapeHtml(heading)}</h1>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px;" />
    <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
      You are receiving this because someone entered this address on ${escapeHtml(APP_NAME)}.
      If that was not you, no action is needed — your account is unchanged.
    </p>
  </div>
</div>`;

const sendTempPasswordEmail = async ({ to, username, tempPassword, siteUrl }) => {
    const subject = `Your temporary ${APP_NAME} password`;
    const safeUsername = escapeHtml(username);
    const safeTempPassword = escapeHtml(tempPassword);
    const loginUrl = escapeHtml(`${siteUrl}/login`);

    const html = layout(
        'Here is your temporary password',
        `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
          Hi <strong>${safeUsername}</strong>, use the temporary password below to sign in.
          You will be asked to choose a new one right away.
        </p>
        <div style="margin:0 0 20px;padding:16px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;text-align:center;">
          <code style="font-size:22px;font-weight:700;letter-spacing:2px;color:#0f172a;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${safeTempPassword}</code>
        </div>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">
          This password expires in 60 minutes and can only be used once.
        </p>
        <a href="${loginUrl}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:12px;">Sign in</a>
        `
    );

    const text = [
        `Hi ${username},`,
        '',
        `Your temporary ${APP_NAME} password is: ${tempPassword}`,
        '',
        'It expires in 60 minutes and can only be used once. You will be asked',
        'to choose a new password as soon as you sign in.',
        '',
        `Sign in: ${siteUrl}/login`,
        '',
        'If you did not request this, you can ignore this email — your account is unchanged.',
    ].join('\n');

    await sendEmail({ to, subject, html, text });
};

const sendEmailChangeConfirmationEmail = async ({ to, username, confirmUrl }) => {
    const subject = `Confirm your new ${APP_NAME} email`;
    const safeUsername = escapeHtml(username);
    const safeConfirmUrl = escapeHtml(confirmUrl);

    const html = layout(
        'Confirm your new email address',
        `
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">
          Hi <strong>${safeUsername}</strong>, confirm this address before it is added to your account.
          This link expires in 60 minutes.
        </p>
        <a href="${safeConfirmUrl}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:12px;">Confirm email</a>
        `
    );

    const text = [
        `Hi ${username},`,
        '',
        `Confirm this address for your ${APP_NAME} account: ${confirmUrl}`,
        '',
        'This link expires in 60 minutes. If you did not request this, ignore it.',
    ].join('\n');

    await sendEmail({ to, subject, html, text });
};

const sendEmailChangedEmail = async ({ to, username, newEmail, recoveryUrl }) => {
    const subject = `The email on your ${APP_NAME} account changed`;
    const safeUsername = escapeHtml(username);
    const safeNewEmail = escapeHtml(newEmail);
    const safeRecoveryUrl = escapeHtml(recoveryUrl);

    const html = layout(
        'Your account email was changed',
        `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
          Hi <strong>${safeUsername}</strong>, the email address on your account was just changed to
          <strong>${safeNewEmail}</strong>. Password resets will now go there.
        </p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">
          If you did not do this, restore this address and secure the account. This recovery link
          expires in 24 hours.
        </p>
        <a href="${safeRecoveryUrl}" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:12px;">Recover my account</a>
        `
    );

    const text = [
        `Hi ${username},`,
        '',
        `The email address on your ${APP_NAME} account was changed to ${newEmail}.`,
        '',
        `If this was not you, recover your account within 24 hours: ${recoveryUrl}`,
    ].join('\n');

    await sendEmail({ to, subject, html, text });
};

const siteUrlFrom = (req) => {
    let candidate;
    if (process.env.PUBLIC_SITE_URL) {
        candidate = process.env.PUBLIC_SITE_URL;
    } else {
        const host = String(req.headers['x-forwarded-host'] || req.headers.host || '')
            .split(',')[0]
            .trim();
        const proto = String(req.headers['x-forwarded-proto'] || (isProduction ? 'https' : 'http'))
            .split(',')[0]
            .trim();
        candidate = host ? `${proto}://${host}` : 'http://localhost:3000';
    }

    try {
        return new URL(candidate).origin;
    } catch {
        throw new Error('Could not determine a valid public site URL for email links.');
    }
};

module.exports = {
    sendEmail,
    sendTempPasswordEmail,
    sendEmailChangeConfirmationEmail,
    sendEmailChangedEmail,
    siteUrlFrom,
};
