import { Queue } from "bullmq";
import IORedis from "ioredis";
import Contact from "../models/contact.model.js";
import EmailLog from "../models/emailLog.model.js";
import MailCampaign from "../models/mailCampaign.model.js";
import NewsletterSubscription from "../models/newsletterSubscription.model.js";
import EmailTemplate from "../models/emailTemplate.model.js";

const redisConnection = new IORedis(process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || "redis://localhost:6379", {
	maxRetriesPerRequest: null,
	tls: process.env.UPSTASH_REDIS_URL ? { rejectUnauthorized: false } : undefined
});

export const emailQueue = new Queue("email-campaigns", { connection: redisConnection });

// Helper to replace {{var}} - Minimal fallback if Handlebars isn't used directly
export const injectVariables = (html, vars) => {
	let result = html;
	for (const key in vars) {
		const regex = new RegExp("{{" + key + "}}", "g");
		result = result.replace(regex, vars[key]);
	}
	return result;
};

// 1. Dashboard Stats
export const getMailStats = async (req, res) => {
	try {
		const totalSubscribers = await NewsletterSubscription.countDocuments({ isSubscribed: true });
		const totalCampaigns = await MailCampaign.countDocuments();
		const recentLogs = await EmailLog.find().sort({ createdAt: -1 }).limit(10);
		
		const stats = {
			totalSubscribers,
			totalCampaigns,
			sentEmails: await EmailLog.countDocuments({ status: "sent" }),
			openRate: 0 // Placeholder
		};
		
		res.json({ stats, recentLogs });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// 2. Inbox (Contact Messages)
export const getInbox = async (req, res) => {
	try {
		const messages = await Contact.find().sort({ createdAt: -1 });
		res.json({ messages });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

export const deleteMessage = async (req, res) => {
	try {
		await Contact.findByIdAndDelete(req.params.id);
		res.json({ message: "Message deleted" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// 3. Templates
export const getTemplates = async (req, res) => {
	try {
		const templates = await EmailTemplate.find().sort({ createdAt: -1 });
		res.json({ templates });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

export const createTemplate = async (req, res) => {
	try {
		const template = await EmailTemplate.create(req.body);
		res.status(201).json(template);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

export const updateTemplate = async (req, res) => {
	try {
		const template = await EmailTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
		res.json(template);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

// 4. Campaigns
export const getCampaigns = async (req, res) => {
	try {
		const campaigns = await MailCampaign.find().populate("template").sort({ createdAt: -1 });
		res.json({ campaigns });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

export const createCampaign = async (req, res) => {
	try {
		const campaign = await MailCampaign.create(req.body);
		res.status(201).json(campaign);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

export const sendCampaignNow = async (req, res) => {
	try {
		const campaign = await MailCampaign.findById(req.params.id).populate("template");
		if (!campaign) return res.status(404).json({ message: "Không tìm thấy chiến dịch." });

		campaign.status = "sending";
		await campaign.save();

		let targetEmails = [];
		if (campaign.targetAudience === "all" || campaign.targetAudience === "newsletter") {
			const subs = await NewsletterSubscription.find({ isSubscribed: true }).select("email");
			targetEmails = subs.map(s => s.email);
		}

		const jobs = targetEmails.map(email => ({
			name: "send-single-mail",
			data: {
				email,
				campaignId: campaign._id,
				subject: campaign.subject,
				html: campaign.customHtml || campaign.template?.htmlContent,
				type: "marketing"
			}
		}));

		await emailQueue.addBulk(jobs);
		res.json({ message: "Đang xử lý gửi " + targetEmails.length + " email..." });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

export const scheduleCampaign = async (req, res) => {
	try {
		const campaign = await MailCampaign.findByIdAndUpdate(req.params.id, {
			status: "scheduled",
			scheduledAt: req.body.scheduledAt
		}, { new: true });
		res.json(campaign);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// 5. Inbox (Contact Messages) - Additional
export const markContactRead = async (req, res) => {
	try {
		await Contact.findByIdAndUpdate(req.params.id, { isRead: true });
		res.json({ message: "Contact marked as read" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

export const replyToContact = async (req, res) => {
	try {
		const { email, subject, message } = req.body;
		await emailQueue.add("send-single-mail", {
			email,
			subject: "Re: " + subject,
			html: message
		});
		res.json({ message: "Reply queued" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// 5. Subscribers
export const getSubscribers = async (req, res) => {
	try {
		const subscribers = await NewsletterSubscription.find().sort({ createdAt: -1 });
		res.json({ subscribers });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

export const exportSubscribers = async (req, res) => {
	try {
		const subscribers = await NewsletterSubscription.find({ isSubscribed: true }).select("email createdAt source");
		res.json(subscribers);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// --- PUBLIC TRACKING & NEWSLETTER ---

export const subscribeNewsletter = async (req, res) => {
	try {
		const { email, source = "footer" } = req.body;
		if (!email) return res.status(400).json({ message: "Email là bắt buộc." });

		const existing = await NewsletterSubscription.findOne({ email });
		if (existing) {
			if (existing.isSubscribed) {
				return res.status(200).json({ message: "Bạn đã đăng ký nhận tin rồi!" });
			}
			existing.isSubscribed = true;
			existing.source = source;
			await existing.save();
		} else {
			await NewsletterSubscription.create({ email, source });
		}

		// Queue Welcome Email
		await emailQueue.add("welcome-email", {
			email,
			fullName: "Khách hàng thân mến",
			subject: "Chào mừng bạn đến với Luxury Watch Store!",
			shopUrl: process.env.CLIENT_URL || "http://localhost:5173",
			unsubscribeLink: (process.env.BACKEND_URL || "http://localhost:5000") + "/api/mail/unsubscribe/" + email
		});

		res.json({ message: "Đăng ký thành công! Vui lòng kiểm tra email chào mừng." });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

export const trackOpen = async (req, res) => {
	try {
		const { logId } = req.params;
		await EmailLog.findByIdAndUpdate(logId, {
			$push: { openedAt: new Date() },
			$set: { status: "read" },
			metadata: { ip: req.ip, userAgent: req.headers["user-agent"] }
		});
		const pixel = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
		res.writeHead(200, {
			"Content-Type": "image/gif",
			"Content-Length": pixel.length,
			"Cache-Control": "no-cache, no-store, must-revalidate"
		});
		res.end(pixel);
	} catch (error) {
		res.status(200).end();
	}
};

export const trackClick = async (req, res) => {
	try {
		const { logId } = req.params;
		const { redirect } = req.query;
		await EmailLog.findByIdAndUpdate(logId, {
			$push: { clickedLinks: { url: redirect, clickedAt: new Date() } }
		});
		res.redirect(redirect || process.env.CLIENT_URL);
	} catch (error) {
		res.redirect(process.env.CLIENT_URL);
	}
};

export const unsubscribe = async (req, res) => {
	try {
		const { email } = req.params;
		await NewsletterSubscription.findOneAndUpdate(
			{ email },
			{ isSubscribed: false, unsubscribedAt: new Date(), unsubscribedReason: "User requested" }
		);
		res.send("<h1>Bạn đã hủy đăng ký nhận tin thành công.</h1><p>Chúng tôi rất tiếc khi thấy bạn rời đi.</p>");
	} catch (error) {
		res.status(500).send("Có lỗi xảy ra.");
	}
};
