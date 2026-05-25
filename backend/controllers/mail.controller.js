import { Queue } from "bullmq";
import IORedis from "ioredis";
import Contact from "../models/contact.model.js";
import EmailLog from "../models/emailLog.model.js";
import MailCampaign from "../models/mailCampaign.model.js";
import NewsletterSubscription from "../models/newsletterSubscription.model.js";
import EmailTemplate from "../models/emailTemplate.model.js";

// Imports for synchronous fallback direct sending
import Handlebars from "handlebars";
import { sendEmail } from "../lib/email.js";
import { 
	welcomeTemplate, 
	orderConfirmationTemplate, 
	adminNotificationTemplate, 
	abandonedCartTemplate 
} from "../lib/emailTemplates.js";

// Provide a safe stub queue when running tests or when Redis is unavailable
let emailQueue = {
	add: async (name, payload) => {
		console.log(`[Mail Stub Queue] Fallback directly sending email "${name}" to ${payload.email}...`);
		try {
			let finalHtml = payload.html;
			if (!finalHtml) {
				if (name === "welcome-email") {
					finalHtml = Handlebars.compile(welcomeTemplate)(payload);
				} else if (name === "order-confirmation") {
					finalHtml = Handlebars.compile(orderConfirmationTemplate)(payload);
				} else if (name === "admin-notification") {
					finalHtml = Handlebars.compile(adminNotificationTemplate)(payload);
				} else if (name === "abandoned-cart") {
					finalHtml = Handlebars.compile(abandonedCartTemplate)(payload);
				} else if (name === "verify-email") {
					finalHtml = `
						<div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 1000px; margin: auto; padding: 40px 16px; background: #f7f5ef; border-radius: 18px;">
							<div style="max-width: 680px; margin: auto; background: #fff; border-radius: 16px; border: 1px solid #e3e3e3; padding: 28px;">
								<h2 style="font-size: 24px; color: #b7925a; margin-bottom: 16px; text-align: center;">Xác minh tài khoản Luxury Watch</h2>
								<p style="font-size: 16px; color: #374151; line-height: 1.6;">Chào <strong>${payload.userName || "Khách Hàng"}</strong>,</p>
								<p style="font-size: 16px; color: #374151; line-height: 1.6;">Cảm ơn bạn đã đăng ký tài khoản tại Luxury Watch. Nhấn nút bên dưới để xác minh email và hoàn tất kích hoạt tài khoản.</p>
								<div style="text-align: center; margin: 24px 0;">
									<a href="${payload.verifyUrl}" target="_blank" rel="noreferrer" style="background: #b7925a; color: #fff; text-decoration: none; font-weight: 700; padding: 12px 26px; border-radius: 8px; font-size: 16px; display: inline-block;">Xác minh tài khoản</a>
								</div>
								<p style="font-size: 14px; color: #6b7280; line-height: 1.5;">Nếu nút không hoạt động, sao chép và dán liên kết dưới đây vào trình duyệt:</p>
								<p style="font-size: 13px; color: #9ca3af; word-break: break-all;">${payload.verifyUrl}</p>
								<p style="font-size: 14px; color: #6b7280; line-height: 1.5;">Liên kết này có hiệu lực trong 15 phút và chỉ sử dụng một lần.</p>
								<p style="font-size: 14px; color: #6b7280; margin-top: 18px;">Trân trọng,<br/><strong>Đội ngũ Luxury Watch</strong></p>
							</div>
							<div style="text-align:center; font-size:12px; color:#9ca3af; margin-top:12px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</div>
						</div>
					`;
				} else if (name === "order-status-update") {
					finalHtml = `
						<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
							<h2 style="color: #D4AF37; text-align: center;">Thông báo cập nhật đơn hàng</h2>
							<p>Kính gửi quý khách,</p>
							<p>Đơn hàng <strong>#${payload.order.orderCode}</strong> của quý khách đã được cập nhật trạng thái: <strong style="color: #b8860b; text-transform: uppercase;">${payload.order.status}</strong>.</p>
							<p>Quý khách có thể xem chi tiết hành trình vận chuyển tại: <br/><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/order-tracking/${payload.order.trackingToken}" style="color: #D4AF37; font-weight: bold; text-decoration: none;">Theo dõi đơn hàng</a></p>
							<hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
							<p style="font-size: 12px; color: #777; text-align: center;">Cảm ơn quý khách đã mua sắm tại Luxury Watch Store.</p>
						</div>
					`;
				}
			} else {
				const compiled = Handlebars.compile(finalHtml);
				finalHtml = compiled(payload);
			}

			// Capture/Create Email Log for tracking in dev
			let log = null;
			if (payload.campaignId || payload.type === "marketing" || name === "abandoned-cart") {
				try {
					log = await EmailLog.create({
						campaignId: payload.campaignId,
						email: payload.email,
						status: "queued"
					});
				} catch (logErr) {
					console.error("[Mail Stub Queue] Failed to create email log:", logErr.message);
				}
			}

			// Add unsubscribe link for Marketing/Campaigns/Abandoned Cart
			if (payload.campaignId || payload.type === "marketing" || name === "abandoned-cart") {
				const unsubLink = `<div style="margin-top: 50px; text-align: center; font-size: 12px; color: #999;">
					Bạn nhận được email này vì đã có hoạt động tại Luxury Watch Store. 
					<a href="${process.env.BACKEND_URL || "http://localhost:5000"}/api/mail/unsubscribe/${payload.email}" style="color: #D4AF37;">Hủy đăng ký</a>
				</div>`;
				finalHtml += unsubLink;
			}

			const recipient = payload.type === "admin-notification" ? (process.env.ADMIN_EMAIL || "admin@watchstore.com") : payload.email;
			await sendEmail(recipient, payload.subject, finalHtml);

			if (log) {
				log.status = "sent";
				await log.save();
			}
			console.log(`[Mail Stub Queue] Fallback email sent successfully to ${recipient}`);
		} catch (error) {
			console.error(`[Mail Stub Queue] Fallback direct send failed:`, error.message);
			throw error;
		}
	},
	addBulk: async (jobs) => {
		console.log(`[Mail Stub Queue] Processing ${jobs.length} bulk jobs directly...`);
		for (const job of jobs) {
			await emailQueue.add(job.name, job.data);
		}
	}
};

const isNodeTestRunner = process.execArgv && process.execArgv.some((a) => String(a).includes("--test"));

if (process.env.NODE_ENV !== 'test' && !isNodeTestRunner) {
	try {
		const redisConnection = new IORedis(process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || "redis://localhost:6379", {
			maxRetriesPerRequest: null,
			tls: process.env.UPSTASH_REDIS_URL ? { rejectUnauthorized: false } : undefined
		});
		redisConnection.on("error", (err) => {
			console.error("[Mail] IORedis connection error on controller Queue:", err.message);
		});
		emailQueue = new Queue("email-campaigns", { connection: redisConnection });
	} catch (err) {
		console.error('[Mail] Redis connection failed, using stub queue:', err?.message || err);
	}
}

export { emailQueue };

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
		const days = parseInt(req.query.days) || 7;
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const totalSubscribers = await NewsletterSubscription.countDocuments({ isSubscribed: true });
		const totalCampaigns = await MailCampaign.countDocuments();
		const recentLogs = await EmailLog.find().sort({ createdAt: -1 }).limit(10);
		const sentEmails = await EmailLog.countDocuments({ status: "sent" });
		
		const totalOpened = await EmailLog.countDocuments({ openedAt: { $exists: true, $not: { $size: 0 } } });
		const openRate = sentEmails > 0 ? ((totalOpened / sentEmails) * 100).toFixed(1) : 0;

		const stats = {
			totalSubscribers,
			totalCampaigns,
			sentEmails,
			openRate
		};

		const dailyAggregates = await EmailLog.aggregate([
			{ $match: { createdAt: { $gte: startDate } } },
			{
				$group: {
					_id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
					sent: { $sum: 1 },
					opened: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ["$openedAt", []] } }, 0] }, 1, 0] } },
					clicked: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ["$clickedLinks", []] } }, 0] }, 1, 0] } }
				}
			}
		]);

		const chartDataMap = {};
		for (let i = days - 1; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const dateStr = d.toISOString().split("T")[0];
			const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
			chartDataMap[dateStr] = { name: dayName, sent: 0, opened: 0, clicked: 0 };
		}

		dailyAggregates.forEach(agg => {
			if (chartDataMap[agg._id]) {
				chartDataMap[agg._id].sent = agg.sent;
				chartDataMap[agg._id].opened = agg.opened;
				chartDataMap[agg._id].clicked = agg.clicked;
			}
		});

		const chartData = Object.values(chartDataMap);

		res.json({ stats, recentLogs, chartData });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// 2. Inbox (Contact Messages)
export const getInbox = async (req, res) => {
	try {
		const page = Math.max(parseInt(req.query.page) || 1, 1);
		const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
		const search = (req.query.search || "").trim();
		const isRead = req.query.isRead !== undefined ? req.query.isRead === "true" : undefined;

		const filter = {};
		if (isRead !== undefined) filter.isRead = isRead;
		if (search) {
			filter.$or = [
				{ name: { $regex: search, $options: "i" } },
				{ email: { $regex: search, $options: "i" } },
				{ message: { $regex: search, $options: "i" } }
			];
		}

		const total = await Contact.countDocuments(filter);
		const messages = await Contact.find(filter)
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit);

		res.json({ 
			messages, 
			pagination: { currentPage: page, totalPages: Math.ceil(total / limit) || 1, total, limit } 
		});
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
		const page = Math.max(parseInt(req.query.page) || 1, 1);
		const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
		const search = (req.query.search || "").trim();

		const filter = {};
		if (search) {
			filter.$or = [
				{ name: { $regex: search, $options: "i" } },
				{ subject: { $regex: search, $options: "i" } }
			];
		}

		const total = await EmailTemplate.countDocuments(filter);
		const templates = await EmailTemplate.find(filter)
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit);

		res.json({ 
			templates,
			pagination: { currentPage: page, totalPages: Math.ceil(total / limit) || 1, total, limit }
		});
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
		const page = Math.max(parseInt(req.query.page) || 1, 1);
		const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
		const search = (req.query.search || "").trim();
		const status = req.query.status;

		const filter = {};
		if (status) filter.status = status;
		if (search) {
			filter.$or = [
				{ name: { $regex: search, $options: "i" } },
				{ subject: { $regex: search, $options: "i" } }
			];
		}

		const total = await MailCampaign.countDocuments(filter);
		const campaigns = await MailCampaign.find(filter)
			.populate("template")
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit);

		res.json({ 
			campaigns, 
			pagination: { currentPage: page, totalPages: Math.ceil(total / limit) || 1, total, limit }
		});
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
		const page = Math.max(parseInt(req.query.page) || 1, 1);
		const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
		const search = (req.query.search || "").trim();
		const isSubscribed = req.query.isSubscribed !== undefined ? req.query.isSubscribed === "true" : undefined;

		const filter = {};
		if (isSubscribed !== undefined) filter.isSubscribed = isSubscribed;
		if (search) {
			filter.email = { $regex: search, $options: "i" };
		}

		const total = await NewsletterSubscription.countDocuments(filter);
		const subscribers = await NewsletterSubscription.find(filter)
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.select("-unsubscribeToken"); // Never expose unsubscribe token in admin list

		res.json({ 
			subscribers, 
			pagination: { currentPage: page, totalPages: Math.ceil(total / limit) || 1, total, limit }
		});
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

export const deleteSubscriber = async (req, res) => {
	try {
		const { id } = req.params;
		await NewsletterSubscription.findByIdAndDelete(id);
		res.json({ message: "Subscriber deleted" });
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
			// Use token-based unsubscribe link instead of raw email in URL
			unsubscribeLink: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/mail/unsubscribe/by-token/${
				existing?.unsubscribeToken ||
				(await NewsletterSubscription.findOne({ email }))?.unsubscribeToken ||
				""
			}`
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
		// Legacy email-based unsubscribe (kept for backward compatibility)
		await NewsletterSubscription.findOneAndUpdate(
			{ email },
			{ isSubscribed: false, unsubscribedAt: new Date(), unsubscribedReason: "User requested" }
		);
		res.send("<h1>Bạn đã hủy đăng ký nhận tin thành công.</h1><p>Chúng tôi rất tiếc khi thấy bạn rời đi.</p>");
	} catch (error) {
		res.status(500).send("Có lỗi xảy ra.");
	}
};

// C.4 Fix: Token-based unsubscribe to avoid PII in URL
export const unsubscribeByToken = async (req, res) => {
	try {
		const { token } = req.params;
		if (!token) {
			return res.status(400).send("<h1>Token không hợp lệ.</h1>");
		}
		const sub = await NewsletterSubscription.findOneAndUpdate(
			{ unsubscribeToken: token },
			{ isSubscribed: false, unsubscribedAt: new Date(), unsubscribedReason: "User requested via token" },
			{ new: true }
		);
		if (!sub) {
			return res.status(404).send("<h1>Liên kết hủy đăng ký không hợp lệ hoặc đã được sử dụng.</h1>");
		}
		res.send("<h1>Bạn đã hủy đăng ký nhận tin thành công.</h1><p>Chúng tôi rất tiếc khi thấy bạn rời đi.</p>");
	} catch (error) {
		res.status(500).send("Có lỗi xảy ra.");
	}
};
