// sync_lifelogs.ts
// Fetch lifelogs from Limitless and cache them in local SQLite DB
import dotenv from 'dotenv';
import db from './db';
import { getLifelogs } from './_client';

dotenv.config();

async function syncLifelogs() {
  const apiKey = process.env.LIMITLESS_API_KEY || '';
  if (!apiKey) {
    console.error('LIMITLESS_API_KEY is not set.');
    process.exit(1);
  }

  // Fetch all lifelogs from Limitless using pagination (limit: null = all)
  // Only insert logs that are not already present in the DB (by id)
  const lifelogs = await getLifelogs({ apiKey, limit: null });

  // Prepare insert/update statement
  const stmt = db.prepare(`
    INSERT INTO lifelogs (id, title, markdown, startTime, endTime, updatedAt)
    VALUES (@id, @title, @markdown, @startTime, @endTime, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title,
      markdown=excluded.markdown,
      startTime=excluded.startTime,
      endTime=excluded.endTime,
      updatedAt=excluded.updatedAt;
  `);

  // Query all existing IDs in the DB to avoid re-inserting
  const existingIds = new Set(db.prepare('SELECT id FROM lifelogs').all().map((row: any) => row.id));

  let count = 0;
  for (const log of lifelogs) {
    if (!existingIds.has(log.id)) {
      stmt.run({
        id: log.id,
        title: log.title,
        markdown: log.markdown,
        startTime: log.startTime,
        endTime: log.endTime,
        updatedAt: log.updatedAt
      });
      count++;
    }
  }
  console.log(`Synced ${count} new lifelogs to local DB. (Skipped ${lifelogs.length - count} already present)`);
}

syncLifelogs().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
