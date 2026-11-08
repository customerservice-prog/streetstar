import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required to start StreetStar.");
  process.exit(1);
}
const schema = await fs.readFile(path.resolve("database/schema.sql"), "utf8");
let ready = false;
for (let attempt = 1; attempt <= 8; attempt++) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    await client.query(schema);
    ready = true;
    console.log("StreetStar database schema verified.");
    break;
  } catch (e) {
    console.error("Database initialization attempt " + attempt + " failed: " + (e?.code || e?.message || "unknown"));
    if (attempt < 8) await new Promise(resolve => setTimeout(resolve, 4000));
  } finally {
    await client.end().catch(() => {});
  }
}
if (!ready) {
  console.error("Database initialization failed. Refusing to start the app.");
  process.exit(1);
}
