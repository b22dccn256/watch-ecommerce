import mongoose from "mongoose";
import Product from "../models/product.model.js";
import { connectDB } from "../lib/db.js";
import { generateSlugToken, slugifyProductName } from "../lib/product-slug.js";

const ensureUniqueSlug = async (baseSlug, currentId) => {
  let candidate = baseSlug || "product";
  let suffix = 2;
  while (await Product.exists({ slug: candidate, _id: { $ne: currentId } })) {
    candidate = `${baseSlug || "product"}-${suffix}`;
    suffix += 1;
  }
  return candidate;
};

const ensureUniqueToken = async (currentId) => {
  let token = generateSlugToken(6);
  while (await Product.exists({ slugToken: token, _id: { $ne: currentId } })) {
    token = generateSlugToken(6);
  }
  return token;
};

const run = async () => {
  await connectDB();

  const cursor = Product.find({}).cursor();
  let updated = 0;

  for await (const product of cursor) {
    const nextOldSlugs = Array.isArray(product.oldSlugs)
      ? [...new Set(product.oldSlugs.filter(Boolean))]
      : [];
    const baseSlug = slugifyProductName(product.name) || "product";
    const nextSlug = product.slug
      ? await ensureUniqueSlug(product.slug, product._id)
      : await ensureUniqueSlug(baseSlug, product._id);
    const slugChanged = !product.slug || product.slug !== nextSlug;

    if (slugChanged && product.slug && !nextOldSlugs.includes(product.slug)) {
      nextOldSlugs.push(product.slug);
    }

    const nextToken =
      product.slugToken || (await ensureUniqueToken(product._id));
    const tokenChanged = product.slugToken !== nextToken;

    if (
      slugChanged ||
      tokenChanged ||
      nextOldSlugs.length !== (product.oldSlugs || []).length
    ) {
      await Product.updateOne(
        { _id: product._id },
        {
          $set: {
            slug: nextSlug,
            slugToken: nextToken,
            oldSlugs: nextOldSlugs,
          },
        },
        { runValidators: false },
      );
      updated += 1;
    }
  }

  console.log(`Migrated ${updated} products with slug/token data.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Product slug migration failed:", error);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
