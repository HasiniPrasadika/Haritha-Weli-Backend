import nodemailer from "nodemailer";
import { EMAIL_USER, EMAIL_PASS } from "../secrets";

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
    });

    await transporter.sendMail({
        from: `"Haritha Weli" <${EMAIL_USER}>`,
        to,
        subject,
        html,
    });
};
