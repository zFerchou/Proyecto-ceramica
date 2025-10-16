// backend/utils/mailer.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'luisfernandoma94@gmail.com',
    pass: process.env.SMTP_PASS || 'qeuy bezk wdhg owct',
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
