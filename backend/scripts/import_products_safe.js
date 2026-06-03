import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import readline from "readline";
import { connectDB } from "../lib/db.js";
import Product from "../models/product.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    file: "exports/products_fixed_500.txt",
    dryRun: true,
    preview: 10,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--file" && args[i + 1]) {
      opts.file = args[++i];
    }
    if (a === "--no-dry-run") {
      opts.dryRun = false;
    }
    if (a === "--dry-run") {
      opts.dryRun = true;
    }
    if (a === "--preview" && args[i + 1]) {
      opts.preview = parseInt(args[++i], 10);
    }
  }
  return opts;
}

async function run() {
  const opts = parseArgs();
  const filePath = path.isAbsolute(opts.file)
    ? opts.file
    : path.join(__dirname, "..", opts.file.replace(/^\//, ""));

  if (!fs.existsSync(filePath)) {
    console.error("Input file not found:", filePath);
    process.exit(1);
  }

  await connectDB();

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let lineNo = 0;
  const validDocs = [];
  const invalid = [];

  for await (const line of rl) {
    lineNo++;
    if (!line.trim()) continue;
    let doc;
    try {
      doc = JSON.parse(line);
    } catch (err) {
      invalid.push({
        line: lineNo,
        error: "Invalid JSON",
        detail: err.message,
        raw: line.slice(0, 200),
      });
      continue;
    }

    try {
      // Preprocess doc to avoid cast errors for refs when using slugs
      const docForValidate = { ...doc };
      if (
        typeof docForValidate.brand === "string" &&
        !/^[a-fA-F0-9]{24}$/.test(docForValidate.brand)
      ) {
        // remove non-ObjectId brand values for validation; keep original in customAttributes
        docForValidate.customAttributes = docForValidate.customAttributes || [];
        docForValidate.customAttributes.push({
          name: "originalBrand",
          value: String(docForValidate.brand),
        });
        delete docForValidate.brand;
      }
      if (
        docForValidate._id &&
        !/^[a-fA-F0-9]{24}$/.test(String(docForValidate._id))
      ) {
        // drop non-ObjectId _id to avoid cast errors during validation; we'll keep original in _sourceId later
        docForValidate._sourceId = docForValidate._id;
        delete docForValidate._id;
      }
      if (docForValidate.type)
        docForValidate.type = String(docForValidate.type).toLowerCase();

      // Create Mongoose document for validation only
      const p = new Product(docForValidate);
      await p.validate();
      // remove Mongoose internals before saving later
      const obj = p.toObject({ depopulate: true });
      delete obj._id; // let Mongo assign real ObjectId on actual insert
      // preserve original id if present
      if (doc._id) obj._sourceId = doc._id;
      validDocs.push({ originalId: doc._id || null, doc: obj, line: lineNo });
    } catch (err) {
      invalid.push({
        line: lineNo,
        error: "ValidationError",
        detail: err.message,
        fields: err.errors ? Object.keys(err.errors) : undefined,
        raw: doc,
      });
    }
  }

  console.log(
    `Processed ${lineNo} lines. Valid: ${validDocs.length}, Invalid: ${invalid.length}`,
  );

  const exportsDir = path.join(__dirname, "..", "exports");
  if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

  const invalidFile = path.join(
    exportsDir,
    `products_invalid_${Date.now()}.jsonl`,
  );
  const validPreviewFile = path.join(
    exportsDir,
    `products_valid_preview_${Date.now()}.csv`,
  );

  // write invalid entries
  if (invalid.length > 0) {
    const w = fs.createWriteStream(invalidFile, { flags: "w" });
    for (const it of invalid) {
      w.write(JSON.stringify(it, Object.keys(it)) + "\n");
    }
    w.end();
    console.log(`Wrote ${invalid.length} invalid entries to ${invalidFile}`);
    console.log("First 5 invalid samples:");
    invalid.slice(0, 5).forEach((it, idx) => {
      console.log(
        `#${idx + 1} line=${it.line} error=${it.error} detail=${it.detail}`,
      );
    });
  }

  // write CSV preview for quick review
  const previewCount = Math.min(opts.preview, validDocs.length);
  if (previewCount > 0) {
    const headers = [
      "name",
      "price",
      "costPrice",
      "stock",
      "brand",
      "collectionName",
      "slug",
    ];
    const w2 = fs.createWriteStream(validPreviewFile, { flags: "w" });
    w2.write(headers.join(",") + "\n");
    for (let i = 0; i < previewCount; i++) {
      const d = validDocs[i].doc;
      const row = [
        d.name,
        d.price,
        d.costPrice,
        d.stock,
        d.brand,
        d.collectionName,
        d.slug,
      ]
        .map((v) => '"' + String(v).replace(/"/g, '""') + '"')
        .join(",");
      w2.write(row + "\n");
    }
    w2.end();
    console.log(
      `Wrote ${previewCount} valid preview rows to ${validPreviewFile}`,
    );
  }

  if (opts.dryRun) {
    console.log(
      "Dry-run enabled — no database changes made. If output looks good, re-run with `--no-dry-run` to import.",
    );
    process.exit(invalid.length > 0 ? 2 : 0);
  }

  // Actual insert (careful): use insertMany in batches
  console.log("Starting import of", validDocs.length, "documents...");
  const BATCH = 100;
  for (let i = 0; i < validDocs.length; i += BATCH) {
    const batch = validDocs.slice(i, i + BATCH).map((v) => v.doc);
    try {
      const res = await Product.insertMany(batch, { ordered: false });
      console.log(`Inserted batch ${i / BATCH + 1}: ${res.length} docs`);
    } catch (err) {
      console.error("Batch insert error:", err.message);
    }
  }

  console.log("Import complete.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
