import crypto from "crypto";
import moment from "moment";

const buildSortedSearchParams = (params) => {
  const searchParams = new URLSearchParams();
  Object.keys(params)
    .sort()
    .forEach((key) => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
  return searchParams;
};

const normalizeIpAddress = (value) => {
  const raw = String(value || "")
    .split(",")[0]
    .trim()
    .replace(/^::ffff:/, "");
  if (!raw) return "127.0.0.1";
  if (raw === "::1") return "127.0.0.1";
  return raw;
};

export const createVNPayUrl = ({ amount, orderId, ipAddr }) => {
  const tmnCode = process.env.VNP_TMN_CODE;
  const secretKey = process.env.VNP_HASH_SECRET || process.env.VNP_SECRET;
  const vnpUrl =
    process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const returnUrl =
    process.env.VNP_RETURN_URL || "http://localhost:5173/payment/vnpay-return";

  if (!tmnCode || !secretKey) {
    throw new Error("VNPAY chưa cấu hình VNP_TMN_CODE hoặc VNP_HASH_SECRET");
  }

  let vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
    vnp_OrderType: "other",
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: moment().format("YYYYMMDDHHmmss"),
  };

  vnpParams = Object.keys(vnpParams)
    .sort()
    .reduce((result, key) => {
      result[key] = vnpParams[key];
      return result;
    }, {});

  const signData = buildSortedSearchParams(vnpParams).toString();
  if (process.env.NODE_ENV === "development") {
    console.debug("[vnpay] signData", signData);
  }
  const secureHash = crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  const finalSearchParams = buildSortedSearchParams({
    ...vnpParams,
    vnp_SecureHash: secureHash,
  });
  return `${vnpUrl}?${finalSearchParams.toString()}`;
};

export const verifyVNPaySignature = (query) => {
  const secretKey = process.env.VNP_HASH_SECRET || process.env.VNP_SECRET || "";
  if (!secretKey) return false;

  const secureHash =
    query.vnp_SecureHash || query.vnp_SecureHash?.toLowerCase();
  if (!secureHash) return false;

  const clone = { ...query };
  delete clone.vnp_SecureHash;
  delete clone.vnp_SecureHashType;
  Object.keys(clone).forEach((key) => {
    if (clone[key] === undefined || clone[key] === null || clone[key] === "") {
      delete clone[key];
    }
  });

  const signData = buildSortedSearchParams(clone).toString();
  if (process.env.NODE_ENV === "development") {
    console.debug("[vnpay] verify signData", signData);
  }
  const signed = crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  return signed.toLowerCase() === secureHash.toLowerCase();
};

export { normalizeIpAddress };
