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