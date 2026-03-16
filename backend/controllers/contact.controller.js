import { sendContactEmail } from "../lib/email.js";
import Contact from "../models/contact.model.js";
import { emailQueue } from "./mail.controller.js";

export const handleContactForm = async (req, res) => {
	try {
		const { name, email, phone, subject, message, _honeypot } = req.body;

		// 1. Check for Honeypot (Anti-spam)
		if (_honeypot) {
			console.log("Spam detected from:", email);
			return res.status(200).json({ message: "Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất." });
		}

		// 2. Validation
		if (!name || !email || !message) {
			return res.status(400).json({ message: "Vui lòng điền đầy đủ các trường bắt buộc (Tên, Email, Lời nhắn)." });
		}

		// 3. Save to Database
		const newContact = await Contact.create({
			name, email, phone, subject, message
		});

		// 4. Queue Email (to Admin)
		await emailQueue.add("admin-notification", {
			type: "contact_form",
			contact: { name, email, phone, subject, message },
			subject: "Tin nhắn mới từ " + name + ": " + (subject || "Không có chủ đề")
		});

		res.status(200).json({ 
			message: "Cảm ơn bạn đã liên hệ. Đội ngũ của chúng tôi sẽ phản hồi sớm nhất qua email.",
			contactId: newContact._id
		});
	} catch (error) {
		console.error("Error in handleContactForm:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
