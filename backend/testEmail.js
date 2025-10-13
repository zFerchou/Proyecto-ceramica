import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verificación del transporte
transporter.verify((error, success) => {
  if (error) {
    console.error("Error en SMTP:", error);
  } else {
    console.log("Servidor listo para enviar correos");
  }
});

// Enviar un correo de prueba
transporter.sendMail({
  from: process.env.EMAIL_FROM,
  to: process.env.EMAIL_USER, // te lo envías a ti mismo para probar
  subject: "Prueba de correo Node.js",
  text: "¡Hola! Este es un correo de prueba desde tu backend."
}, (err, info) => {
  if (err) {
    console.error("Error enviando correo:", err);
  } else {
    console.log("Correo enviado:", info.response);
  }
});
