import sgMail from "@sendgrid/mail";

if (!process.env.SENDGRID_API_KEY) {
	console.error("SENDGRID_API_KEY is not set");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async ({ to, subject, html, text }) => {
	const msg = {
		to,
		from: process.env.NOTIFY_FROM, // must be verified in SendGrid
		subject,
		text,
		html,
	};
	try {
		return await sgMail.send(msg);
	} catch (err) {
		console.error("SendGrid email error:", err);
		throw err;
	}
};
