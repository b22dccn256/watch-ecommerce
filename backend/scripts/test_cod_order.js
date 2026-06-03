import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import { connectDB } from "../lib/db.js";
import Order from "../models/order.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const API_BASE = process.env.API_BASE || `http://localhost:5001/api`;

async function run() {
  try {
    console.log("Fetching a product...");
    const pRes = await axios.get(`${API_BASE}/products?limit=1`);
    const product =
      (pRes.data && pRes.data[0]) ||
      (pRes.data && pRes.data.products && pRes.data.products[0]);
    if (!product) {
      console.error("No product found. Aborting.");
      process.exit(1);
    }

    const payload = {
      products: [
        {
          _id: product._id || product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ],
      couponCode: null,
      shippingDetails: {
        fullName: "Test Buyer",
        email: "test+buyer@example.com",
        phoneNumber: "0123456789",
        address: "123 Test St",
        city: "Hanoi",
      },
      paymentMethod: "cod",
    };

    console.log("Fetching CSRF token...");
    const csrfResp = await axios.get(`${API_BASE}/csrf-token`);
    const csrfToken = csrfResp.data.token || csrfResp.data;
    const setCookie = csrfResp.headers["set-cookie"];
    const cookieHeader = csrfToken
      ? `csrfToken=${csrfToken}`
      : setCookie && setCookie.length
        ? setCookie.map((c) => c.split(";")[0]).join("; ")
        : "";

    console.log("CSRF token:", csrfToken);
    console.log("Cookie header:", cookieHeader);
    console.log("Creating COD checkout session...");
    const res = await axios.post(
      `${API_BASE}/payments/create-checkout-session`,
      payload,
      {
        headers: {
          "x-csrf-token": csrfToken,
          Cookie: cookieHeader,
        },
      },
    );
    console.log("Response:", res.data);

    const orderId = res.data.orderId || res.data.orderId;
    const orderCode = res.data.orderCode || res.data.orderCode;

    await connectDB();
    const order = await Order.findOne({ orderCode }).lean();
    if (!order) {
      console.error("Order not found in DB for", orderCode);
      process.exit(1);
    }

    console.log("Order in DB:");
    console.log("orderCode:", order.orderCode);
    console.log("status:", order.status);
    console.log("paymentStatus:", order.paymentStatus);
    console.log("paymentMethod:", order.paymentMethod);
    console.log("trackingToken:", order.trackingToken);
    console.log("createdAt:", order.createdAt);
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err.response?.data || err.message || err);
    process.exit(1);
  }
}

run();
