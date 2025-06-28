import chrono from 'chrono-node';
import Fuse from 'fuse.js';
import type Database from 'better-sqlite3';


// Parse a natural language memory question for time range and keywords
export function parseMemoryQuery(question: string): {
  timeRange: { start: Date | null; end: Date | null };
  keywords: string[];
} {
  // Use chrono-node to parse dates
  const results = chrono.parse(question);
  let start: Date | null = null;
  let end: Date | null = null;
  if (results.length > 0) {
    const range = results[0];
    start = range.start?.date() || null;
    end = range.end?.date() || start;
  }

  // Naive keyword extraction: remove stopwords, keep nouns/adjectives
  // (For demo: split on spaces, filter out common words)
  const stopwords = [
    'what', 'did', 'say', 'about', 'was', 'there', 'any', 'in', 'my', 'the',
    'a', 'an', 'of', 'to', 'for', 'on', 'at', 'by', 'with', 'and', 'or', 'is', 'it', 'me', 'i', 'you', 'we', 'he', 'she', 'they', 'that', 'this', 'as', 'from', 'but', 'if', 'then', 'so', 'when', 'where', 'how', 'why', 'which', 'who', 'whom', 'whose', 'been', 'be', 'are', 'am', 'have', 'has', 'had', 'do', 'does', 'doing', 'can', 'could', 'should', 'would', 'will', 'shall', 'may', 'might', 'must', 'not', 'no', 'yes', 'just', 'now', 'today', 'yesterday', 'tomorrow', 'week', 'month', 'year', 'day', 'hour', 'minute', 'second', 'last', 'next', 'previous', 'ago', 'before', 'after', 'since', 'until', 'during', 'while', 'over', 'under', 'again', 'more', 'most', 'some', 'such', 'only', 'own', 'same', 'other', 'than', 'too', 'very', 's', 't', 'can', 'will', 'don', 'should', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven', 'isn', 'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren', 'won', 'wouldn'
  ];
  const keywords = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word && !stopwords.includes(word));

  return { timeRange: { start, end }, keywords };
}

// Query relevant lifelogs from SQLite using time range and fuzzy keyword match
export function queryRelevantLifelogs(
  db: any,
  opts: { timeRange: { start: Date | null; end: Date | null }; keywords: string[]; limit?: number }
): any[] {
  const { timeRange, keywords, limit = 20 } = opts;
  let sql = 'SELECT * FROM lifelogs';
  const params: any[] = [];
  const where: string[] = [];

  // Filter by time range if present
  if (timeRange.start && timeRange.end) {
    where.push('startTime >= ? AND endTime <= ?');
    params.push(timeRange.start.toISOString(), timeRange.end.toISOString());
  }

  if (where.length) {
    sql += ' WHERE ' + where.join(' AND ');
  }
  sql += ' ORDER BY startTime DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(sql).all(...params);

  if (!keywords.length) return rows;

  // Fuzzy match on title/markdown using Fuse.js
  const fuse = new Fuse(rows, {
    keys: ['title', 'markdown'],
    threshold: 0.4,
    minMatchCharLength: 2
  });
  const results = fuse.search(keywords.join(' '));
  return results.map(r => r.item);
}
