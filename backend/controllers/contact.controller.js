import { sendContactEmail } from "../lib/email.js";

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

		// 3. Send Email (to Admin)
		await sendContactEmail({
			name,
			email,
			phone,
			subject,
			message
		});

		res.status(200).json({ message: "Cảm ơn bạn đã liên hệ. Chúng tôi đã nhận được thông tin và sẽ phản hồi sớm nhất qua email của bạn." });
	} catch (error) {
		console.error("Error in handleContactForm:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
