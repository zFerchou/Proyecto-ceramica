// backend/utils/mailer.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || "santobarrodh@gmail.com",
    pass: (process.env.EMAIL_PASS || "rzbb naas ipgs pimo").replace(/\s+/g, ""), 
    user: process.env.SMTP_USER || 'santobarrodh@gmail.com',
    pass: process.env.SMTP_PASS || 'rzbb naas ipgs pimo',
  },
});

export async function enviarCorreo(destinatario, asunto, mensaje) {
  await transporter.sendMail({
    from: 'Notificaciones <notificaciones@tuapp.com>',
    to: destinatario,
    subject: asunto,
    text: mensaje,
  });
}
