import nodemailer from "nodemailer";
import validator from "email-validator";
import { google } from "googleapis";

const CLIENT_ID = "your_client_id";
const CLIENT_SECRET = "your_client_secret";
const REDIRECT_URI = "your_redirect_uri";
const REFRESH_TOKEN = "your_refresh_token";

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

export default class SendMailNodemailer {
  private transporter: nodemailer.Transporter;

  private constructor(transporter: nodemailer.Transporter) {
    this.transporter = transporter;
  }

  static async initialize(): Promise<SendMailNodemailer> {
    const accessToken = await oAuth2Client.getAccessToken();

    if (!accessToken) {
      throw new Error("Failed to generate access token");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "mail@gmail.com",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: String(accessToken),
      },
    });

    return new SendMailNodemailer(transporter);
  }

  async sendMail(destiny: string, text: string, html: string): Promise<void> {
    try {
      const result = await this.transporter.sendMail({
        from: "mail@gmail.com",
        to: destiny,
        subject: "Password Reset",
        text: text,
        html: html,
      });

      return result;
    } catch (error) {
      console.error("Failed to send email:", error);
      throw new Error("Failed to send email");
    }
  }

  async isValidMail(email: string): Promise<boolean> {
    return validator.validate(email);
  }

  async isExistentMail(email: string): Promise<boolean> {
    try {
      const result = await this.transporter.verify();
      if (!result) throw new Error("SMTP server not available");

      await this.transporter.sendMail({
        from: "no-reply@example.com",
        to: email,
        subject: "Test Email",
        text: "This is a test to verify email existence.",
      });
      return true;
    } catch (error) {
      console.warn("Email existence verification failed:", error);
      return false;
    }
  }
}

(async () => {
  const mailHandler = await SendMailNodemailer.initialize();

  console.log("sending email...");

  const output = await mailHandler.sendMail(
    "mail@gmail.com",
    "teste",
    "<h1>teste com HTML</h1>"
  );

  console.log("output: ", output);
})();
