import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required to start StreetStar in production.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000 });
const schema = await fs.readFile(path.resolve("database/schema.sql"), "utf8");
let error;
for (let attempt = 1; attempt <= 6; attempt++) {
  try {
    await client.connect();
    await client.query(schema);
    await client.end();
    console.log("StreetStar database schema verified.");
    process.exit(0);
  } catch (e) {
    error = e;
    console.error("Database initialization attempt " + attempt + " failed: " + (e?.code || e?.message || "unknown"));
    if (attempt < 6) await new Promise(resolve => setTimeout(resolve, 4000));
  }
}
console.error("Database initialization failed. Not starting an unconfigured public service.");
process.exit(1);
