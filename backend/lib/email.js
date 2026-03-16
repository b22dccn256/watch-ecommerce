import nodemailer from "nodemailer";

let transporter;

const getTransporter = async () => {
    if (transporter) return transporter;

    // 1. Try Gmail if credentials provided
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            const gmailTransporter = nodemailer.createTransport({
                service: "gmail",
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
                tls: { rejectUnauthorized: false }
            });
            
            // Fast verify
            await Promise.race([
                gmailTransporter.verify(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout verifying Gmail")), 3000))
            ]);
            
            transporter = gmailTransporter;
            console.log("✅ Using Gmail for OTP emails");
            return transporter;
        } catch (error) {
            console.error("❌ Gmail Auth Failed:", error.message);
            console.log("🔄 Falling back to Ethereal Email...");
        }
    }

    // 2. Fallback to Ethereal
    try {
        const testAccount = await nodemailer.createTestAccount();
        console.log("--------------------------------------------------");
        console.log("ℹ️  Using Ethereal Email for development");
        console.log(`User: ${testAccount.user}`);
        console.log(`Pass: ${testAccount.pass}`);
        console.log("--------------------------------------------------");
        
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass },
            tls: { rejectUnauthorized: false }
        });
    } catch (err) {
        console.error("❌ Failed to create Ethereal account:", err.message);
    }
    
    return transporter;
};

export const sendContactEmail = async ({ name, email, phone, subject, message }) => {
	const html = `
		<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
			<h2 style="color: #D4AF37; text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">Tin nhắn liên hệ mới</h2>
			<p><strong>Khách hàng:</strong> ${name}</p>
			<p><strong>Email:</strong> ${email}</p>
			<p><strong>Số điện thoại:</strong> ${phone || "N/A"}</p>
			<p><strong>Chủ đề:</strong> ${subject || "N/A"}</p>
			<div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #D4AF37;">
				<p><strong>Lời nhắn:</strong></p>
				<p>${message}</p>
			</div>
			<p style="font-size: 12px; color: #777; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
				Gửi từ form liên hệ Luxury Watch Store
			</p>
		</div>
	`;

	await sendEmail(process.env.EMAIL_USER || "admin@watchstore.com", `[Contact Form] ${subject || "Yêu cầu hỗ trợ mới"}`, html);
};

export const sendEmail = async (to, subject, html) => {
    try {
        const transport = await getTransporter();
        if (!transport) throw new Error("No mail transporter available");

        const info = await transport.sendMail({ 
            from: process.env.EMAIL_USER || "admin@watchstore.com", 
            to, 
            subject, 
            html 
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log("--------------------------------------------------");
            console.log("📧 OTP EMAIL SENT");
            console.log("Preview URL: " + previewUrl);
            console.log("--------------------------------------------------");
        }
    } catch (error) {
        console.error("⚠️ Email delivery failed:", error.message);
        // Important: We log the error but if we are in development/ethereal mode,
        // we might want the caller to proceed so the OTP flow works.
        // For now, let's keep throwing but the controller will handle it better.
        throw error;
    }
};