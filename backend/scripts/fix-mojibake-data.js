import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: "backend/.env" });

const APPLY = process.argv.includes("--apply");
const VERBOSE = process.argv.includes("--verbose");

const BAD_PATTERN = /(Ã.|Â.|Ä.|Å.|Æ.|á»|áº|â€|�)/g;
const VIET_PATTERN =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/g;

function countMatches(str, regex) {
  const m = str.match(regex);
  return m ? m.length : 0;
}

function looksSuspicious(str) {
  return BAD_PATTERN.test(str);
}

function tryFixLatin1Utf8(str) {
  try {
    return Buffer.from(str, "latin1").toString("utf8");
  } catch {
    return str;
  }
}

function scoreString(str) {
  const bad = countMatches(str, BAD_PATTERN);
  const viet = countMatches(str, VIET_PATTERN);
  return { bad, viet };
}

function chooseBetter(original, candidate) {
  if (!candidate || candidate === original) return original;

  const o = scoreString(original);
  const c = scoreString(candidate);

  const badImproved = c.bad < o.bad;
  const vietNotWorse = c.viet >= o.viet;
  const significantlyBetter = c.bad <= Math.max(0, o.bad - 1);

  if (badImproved && vietNotWorse && significantlyBetter) return candidate;
  return original;
}

function maybeFixString(str) {
  if (!looksSuspicious(str)) return str;
  const fixed = tryFixLatin1Utf8(str);
  return chooseBetter(str, fixed);
}

function walkAndCollect(value, pathPrefix = "", changes = []) {
  if (typeof value === "string") {
    const fixed = maybeFixString(value);
    if (fixed !== value) {
      changes.push({ path: pathPrefix, from: value, to: fixed });
    }
    return changes;
  }

  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      const p = pathPrefix ? `${pathPrefix}.${i}` : `${i}`;
      walkAndCollect(item, p, changes);
    });
    return changes;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([k, v]) => {
      if (k === "_id") return;
      const p = pathPrefix ? `${pathPrefix}.${k}` : k;
      walkAndCollect(v, p, changes);
    });
  }

  return changes;
}

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("Missing MONGO_URI in backend/.env");
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, family: 4 });
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  let totalDocsScanned = 0;
  let totalDocsChanged = 0;
  let totalFieldChanges = 0;
  const samples = [];

  for (const { name } of collections) {
    if (name.startsWith("system.")) continue;

    const col = db.collection(name);
    const cursor = col.find({});
    let colScanned = 0;
    let colChanged = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      colScanned += 1;
      totalDocsScanned += 1;

      const changes = walkAndCollect(doc);
      if (!changes.length) continue;

      colChanged += 1;
      totalDocsChanged += 1;
      totalFieldChanges += changes.length;

      if (samples.length < 30) {
        const first = changes[0];
        samples.push({
          collection: name,
          id: String(doc._id),
          path: first.path,
          from: first.from,
          to: first.to,
          changes: changes.length,
        });
      }

      if (APPLY) {
        const setDoc = {};
        for (const ch of changes) setDoc[ch.path] = ch.to;
        await col.updateOne({ _id: doc._id }, { $set: setDoc });
      }
    }

    if (VERBOSE) {
      console.log(`[${name}] scanned=${colScanned}, changed=${colChanged}`);
    }
  }

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`Scanned docs: ${totalDocsScanned}`);
  console.log(`Docs with fixes: ${totalDocsChanged}`);
  console.log(`Total string fields fixed: ${totalFieldChanges}`);

  if (samples.length) {
    console.log("\nSample fixes:");
    for (const s of samples) {
      console.log(`- [${s.collection}] ${s.id} :: ${s.path}`);
      console.log(`  from: ${s.from}`);
      console.log(`  to  : ${s.to}`);
      console.log(`  field changes in doc: ${s.changes}`);
    }
  } else {
    console.log("No mojibake-like fields detected by current heuristic.");
  }

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("fix-mojibake-data failed:", err.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
