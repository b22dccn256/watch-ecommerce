import crypto from "crypto";

export const slugifyProductName = (value) => {
  return String(value || "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .replace(/-+/g, "-");
};

export const generateSlugToken = (length = 6) => {
  const size = Math.max(4, Number(length) || 4);
  return crypto
    .randomBytes(Math.ceil(size / 2))
    .toString("hex")
    .slice(0, size);
};
