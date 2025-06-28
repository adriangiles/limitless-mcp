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

  // Fetch lifelogs from Limitless
  const lifelogs = await getLifelogs({ apiKey, limit: 100 });

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

  let count = 0;
  for (const log of lifelogs) {
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
  console.log(`Synced ${count} lifelogs to local DB.`);
}

syncLifelogs().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
