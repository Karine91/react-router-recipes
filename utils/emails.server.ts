import FormData from "form-data";
import Mailgun from "mailgun.js";

if (typeof process.env.MAILGUN_API_KEY !== "string") {
  throw new Error("Missing env: MAILGUN_API_KEY");
}

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});

type Message = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

export function sendEmail(message: Message) {
  if (typeof process.env.MAILGUN_DOMAIN !== "string") {
    throw new Error("Missing env: MAILGUN_DOMAIN");
  }
  return mg.messages.create(process.env.MAILGUN_DOMAIN, message);
}
