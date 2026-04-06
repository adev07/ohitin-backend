"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendMail = (body) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = nodemailer_1.default.createTransport({
        host: process.env.NODE_MAIL_HOST,
        port: Number(process.env.NODE_MAIL_PORT || 465),
        secure: process.env.NODE_MAIL_SECURE !== "false",
        auth: {
            user: process.env.NODE_MAIL_EMAIL,
            pass: process.env.NODE_MAIL_PASSWORD,
        },
    });
    yield transporter.sendMail({
        from: process.env.NODE_MAIL_EMAIL,
        to: body.to,
        subject: body.subject,
        text: body.text,
        html: body.html,
    });
});
exports.default = {
    sendMail,
};
//# sourceMappingURL=email.js.map