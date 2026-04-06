import nodemailer from "nodemailer";
import { TMailTypes } from "../types/mail";

const sendMail = async (body: TMailTypes) => {
  const transporter = nodemailer.createTransport({
    host: process.env.NODE_MAIL_HOST,
    port: Number(process.env.NODE_MAIL_PORT || 465),
    secure: process.env.NODE_MAIL_SECURE !== "false",
    auth: {
      user: process.env.NODE_MAIL_EMAIL,
      pass: process.env.NODE_MAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.NODE_MAIL_EMAIL,
    to: body.to,
    subject: body.subject,
    text: body.text,
    html: body.html,
  });
};

export default {
  sendMail,
};
