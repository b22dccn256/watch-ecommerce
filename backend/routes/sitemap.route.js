import express from "express";
import Product from "../models/product.model.js";

const router = express.Router();

const getBaseUrl = (req) => {
  const configured = (process.env.CLIENT_URL || "").trim().replace(/\/$/, "");
  if (configured) return configured;
  return `${req.protocol}://${req.get("host")}`.replace(/\/$/, "");
};

const escapeXml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

router.get("/robots.txt", (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.type("text/plain");
  res.send(
    `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${baseUrl}/sitemap.xml\n`,
  );
});

router.get("/sitemap.xml", async (req, res, next) => {
  try {
    const baseUrl = getBaseUrl(req);
    const products = await Product.find({ deletedAt: null, isActive: true })
      .select("slug slugToken updatedAt")
      .lean();

    const urls = [
      { loc: `${baseUrl}/`, priority: "1.0" },
      { loc: `${baseUrl}/catalog`, priority: "0.9" },
      ...products
        .filter((product) => product.slug && product.slugToken)
        .map((product) => ({
          loc: `${baseUrl}/product/${product.slug}--${product.slugToken}`,
          lastmod: product.updatedAt
            ? new Date(product.updatedAt).toISOString()
            : null,
          priority: "0.8",
        })),
    ];

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls
        .map(
          (entry) =>
            `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : ""}${entry.priority ? `\n    <priority>${entry.priority}</priority>` : ""}\n  </url>`,
        )
        .join("\n") +
      `\n</urlset>\n`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(xml);
  } catch (error) {
    return next(error);
  }
});

export default router;
