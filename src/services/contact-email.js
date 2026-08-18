const nodemailer = require('nodemailer');

let transporter;
let configurationWarningLogged = false;

function value(name) {
  return String(process.env[name] || '').trim();
}

function emailConfiguration() {
  return {
    host: value('SMTP_HOST'),
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: value('SMTP_USER'),
    pass: String(process.env.SMTP_PASS || ''),
    from: value('CONTACT_EMAIL_FROM'),
    to: value('CONTACT_EMAIL_TO'),
  };
}

function configured(config) {
  const hasValidAuthentication = (!config.user && !config.pass) || Boolean(config.user && config.pass);
  return Boolean(config.host && config.from && config.to && Number.isInteger(config.port) && config.port > 0 && hasValidAuthentication);
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]));
}

function headerValue(value) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

function getTransporter(config) {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      ...(config.user || config.pass ? { auth: { user: config.user, pass: config.pass } } : {}),
    });
  }
  return transporter;
}

async function sendContactEmail(contact) {
  const config = emailConfiguration();
  if (!configured(config)) {
    if (!configurationWarningLogged) {
      console.warn('Contact email is disabled. Set SMTP_HOST, CONTACT_EMAIL_FROM, and CONTACT_EMAIL_TO to enable it.');
      configurationWarningLogged = true;
    }
    return false;
  }

  const details = [
    `Name: ${contact.name}`,
    `Company: ${contact.company}`,
    `Email: ${contact.email}`,
    `Phone: ${contact.phone}`,
    '',
    'Message:',
    contact.message,
  ].join('\n');
  const rows = [
    ['Name', contact.name],
    ['Company', contact.company],
    ['Email', contact.email],
    ['Phone', contact.phone],
  ].map(([label, item]) => `<tr><th align="left" style="padding: 0 16px 8px 0">${label}</th><td style="padding: 0 0 8px">${escapeHtml(item)}</td></tr>`).join('');

  await getTransporter(config).sendMail({
    from: config.from,
    to: config.to,
    replyTo: headerValue(contact.email),
    subject: `New website enquiry: ${headerValue(contact.subject)}`,
    text: `New enquiry: ${contact.subject}\n\n${details}`,
    html: `<h2>New website enquiry</h2><table>${rows}</table><h3>Subject</h3><p>${escapeHtml(contact.subject)}</p><h3>Message</h3><p>${escapeHtml(contact.message).replace(/\n/g, '<br>')}</p>`,
  });
  return true;
}

module.exports = { sendContactEmail };
