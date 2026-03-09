import cron from "node-cron";
import User from "../models/user.model.js";
import { sendEmail } from "./email.js";

cron.schedule("0 0 * * *", async () => { // Mỗi ngày
    const users = await User.find({ cartItems: { $ne: [] } }); // Có cart nhưng chưa order
    for (const user of users) {
        sendEmail(user.email, "Don't Forget Your Cart!", "<p>Complete your purchase!</p>");
    }
});