// backend/utils/mailer.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// --- Configurar transporte SMTP de Gmail ---
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // conexión SSL/TLS
  auth: {
    user: process.env.EMAIL_USER || "luisfernandoma94@gmail.com",
    pass: (process.env.EMAIL_PASS || "sonbhxowtjwpytqv").replace(/\s+/g, ""), // elimina espacios por seguridad
  },
});

// --- Función genérica para enviar correos ---
export async function enviarCorreo(destinatario, asunto, mensaje) {
  try {
    const info = await transporter.sendMail({
      from: `"Tienda Online" <${process.env.EMAIL_FROM || "luisfernandoma94@gmail.com"}>`,
      to: destinatario,
      subject: asunto,
      text: mensaje,
    });

    console.log(`✅ Correo enviado a ${destinatario}: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
    throw new Error("No se pudo enviar el correo. Verifica tus credenciales SMTP.");
  }
}
