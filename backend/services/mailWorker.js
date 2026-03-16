import { Worker } from "bullmq";
import IORedis from "ioredis";
import Handlebars from "handlebars";
import { sendEmail } from "../lib/email.js";
import EmailLog from "../models/emailLog.model.js";
import MailCampaign from "../models/mailCampaign.model.js";
import { welcomeTemplate, orderConfirmationTemplate, adminNotificationTemplate, abandonedCartTemplate } from "../lib/emailTemplates.js";

const redisConnection = new IORedis(process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || "redis://localhost:6379", {
	maxRetriesPerRequest: null,
	tls: process.env.UPSTASH_REDIS_URL ? { rejectUnauthorized: false } : undefined
});

const worker = new Worker(
	"email-campaigns",
	async (job) => {
		const { email, campaignId, subject, html, type } = job.data;

		try {
			// 1. Determine the HTML content
			let finalHtml = html;
			
			// Use predefined templates if html is not provided (system emails)
			if (!finalHtml) {
				if (job.name === "welcome-email") {
					finalHtml = Handlebars.compile(welcomeTemplate)(job.data);
				} else if (job.name === "order-confirmation") {
					finalHtml = Handlebars.compile(orderConfirmationTemplate)(job.data);
				} else if (job.name === "admin-notification") {
					finalHtml = Handlebars.compile(adminNotificationTemplate)(job.data);
				} else if (job.name === "abandoned-cart") {
					finalHtml = Handlebars.compile(abandonedCartTemplate)(job.data);
				}
			} else {
				// If html is provided (e.g. from campaign), compile it with job.data (Handlebars)
				const template = Handlebars.compile(finalHtml);
				finalHtml = template(job.data);
			}

			// 2. Create Log Entry
			let logId = null;
			let log = null;
			if (campaignId || type === "marketing" || job.name === "abandoned-cart") {
				log = await EmailLog.create({
					campaignId,
					email,
					status: "queued"
				});
				logId = log._id;
			}

			// 3. Inject Tracking Pixel
			if (logId) {
				const trackingUrl = `${process.env.BACKEND_URL}/api/mail/track/open/${logId}`;
				finalHtml += `<img src="${trackingUrl}" width="1" height="1" style="display:none !important;" />`;
			}
			
			// 4. Add unsubscribe link for Marketing/Campaigns/Abandoned Cart
			if (campaignId || type === "marketing" || job.name === "abandoned-cart") {
				const unsubLink = `<div style="margin-top: 50px; text-align: center; font-size: 12px; color: #999;">
					Bạn nhận được email này vì đã có hoạt động tại Luxury Watch Store. 
					<a href="${process.env.BACKEND_URL}/api/mail/unsubscribe/${email}" style="color: #D4AF37;">Hủy đăng ký</a>
				</div>`;
				finalHtml += unsubLink;
			}

			// 5. Send Email
			const recipient = type === "admin-notification" ? process.env.ADMIN_EMAIL : email;
			await sendEmail(recipient, subject, finalHtml);

			// 6. Update Log & Campaign Stats
			if (log) {
				log.status = "sent";
				await log.save();
			}

			if (campaignId) {
				await MailCampaign.findByIdAndUpdate(campaignId, {
					$inc: { "stats.delivered": 1, "stats.totalSent": 1 },
					$set: { status: "sent", sentAt: new Date() }
				});
			}

		} catch (error) {
			console.error(`Failed to send email to ${email}:`, error.message);
			if (campaignId) {
				await EmailLog.findOneAndUpdate({ campaignId, email }, { 
					status: "failed", 
					error: error.message 
				});
				await MailCampaign.findByIdAndUpdate(campaignId, {
					$inc: { "stats.failed": 1 }
				});
			}
			throw error;
		}
	},
	{ connection: redisConnection }
);

worker.on("completed", (job) => {
	console.log(`Job ${job.id} [${job.name}] completed.`);
});

worker.on("failed", (job, err) => {
	console.error(`Job ${job.id} [${job.name}] failed: ${err.message}`);
});

export default worker;
