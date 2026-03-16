import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../backend/models/order.model.js";
import crypto from "crypto";

dotenv.config({ path: "./backend/.env" });

const populateTrackingTokens = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("MongoDB Connected");

		const ordersWithoutToken = await Order.find({ trackingToken: { $exists: false } });
		console.log(`Found ${ordersWithoutToken.length} orders without trackingToken`);

		for (const order of ordersWithoutToken) {
			order.trackingToken = crypto.randomUUID();
			// Also add a default tracking event if empty
			if (!order.trackingEvents || order.trackingEvents.length === 0) {
				order.trackingEvents = [{
					status: order.status || "pending",
					message: "Order data migrated to tracking system.",
					timestamp: order.createdAt
				}];
			}
			await order.save({ validateBeforeSave: false });
		}

		console.log("Migration complete!");
		process.exit(0);
	} catch (error) {
		console.error("Migration failed:", error.message);
		process.exit(1);
	}
};

populateTrackingTokens();
