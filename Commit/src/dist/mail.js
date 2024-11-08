"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const sendVerificationEmail = (to, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Código de Confirmação',
        text: `Seu código de confirmação é: ${code}`,
    };
    return transporter.sendMail(mailOptions);
};
exports.sendVerificationEmail = sendVerificationEmail;
