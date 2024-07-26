
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  // Configurez vos informations d'envoi d'e-mails (Gmail, SendGrid, etc.)
  service: 'gmail',
  auth: {
    user: 'lesveneres@gmail.com',
    pass: 'chru loqq eaee vmws',
  },
});

module.exports = transporter;

