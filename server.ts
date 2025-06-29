import express from 'express';
import bodyParser from 'body-parser';
import db from './db';
import { getLifelogs, getLifelogById } from './_client';
import OpenAI from 'openai';
import { parseMemoryQuery, queryRelevantLifelogs } from './memory_utils';
import * as chrono from 'chrono-node';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';


const app = express();
app.use(bodyParser.json());

// Add request logging
app.use(morgan('combined'));

// Add rate limiting (e.g., 100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Serve openapi.yaml at /openapi.yaml
import openapiRoute from './openapiRoute';
app.use(openapiRoute);

// Only create OpenAI client once
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Improved system prompt for OpenAI summarisation calls
// This prompt instructs the model to act as an executive assistant, structure output, and focus on meetings, topics, actions, and tone.
const systemPrompt = `
You are an executive assistant helping summarize a user's lifelog entries. Your job is to produce a concise, well-organized, and readable summary for the user, focusing on meetings, key conversations, decisions, and action items. 

Always structure your summary with:
- **Section headings** for each meeting or conversation (include names, titles, or times if available)
- **Bullet points** for topics discussed, decisions made, and action items (with responsible people if known)
- **Emotional tone** or points of tension, if present

Keep the tone friendly, professional, and easy to scan. Avoid unnecessary repetition. If multiple meetings are present, use clear section headings for each. Be as specific as possible with names, times, and responsibilities.
`;

// --- Chunked summarisation for GPT-4 context safety ---
function splitMarkdownIntoChunks(markdown: string, maxChars: number = 12000): string[] {
  const chunks: string[] = [];
  let current = '';
  for (const line of markdown.split('\n')) {
    if ((current + '\n' + line).length > maxChars) {
      if (current.trim()) chunks.push(current);
      current = '';
    }
    current += (current ? '\n' : '') + line;
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}

// --- Utility: sleep for ms ---
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// POST /memory endpoint for conversational memory queries
app.post('/memory', async (req, res) => {
  try {
    const prompt: string = req.body.prompt || req.body.query;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid prompt/query' });
    }

    // 1. Parse the provided `date` into a full day range using chrono-node and moment-timezone
    const moment = require('moment-timezone');
    const chrono = require('chrono-node');
    const timezone: string = req.body.timezone || 'Australia/Melbourne';
    let date: string = req.body.date;
    let start: string | undefined;
    let end: string | undefined;
    if (date) {
      const parsed = chrono.parse(date, new Date(), { forwardDate: true });
      if (parsed.length > 0 && parsed[0].start) {
        start = moment(parsed[0].start.date()).tz(timezone).startOf('day').format();
        end = moment(parsed[0].start.date()).tz(timezone).endOf('day').format();
      }
    }
    if (!start || !end) {
      start = moment().tz(timezone).startOf('day').format();
      end = moment().tz(timezone).endOf('day').format();
    }
    const logDateRange = { start, end };

    // 2. Log the prompt, parsed start/end, and timezone
    console.log('[MEMORY] Prompt:', prompt);
    console.log('[MEMORY] Date:', date, '| Timezone:', timezone);
    console.log('[MEMORY] Parsed range:', logDateRange);

    // 3. Pass both start and end explicitly to the lifelog retrieval query
    const apiKey = process.env.LIMITLESS_API_KEY || '';
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing Limitless API key' });
    }
    const isStarred = req.body.isStarred;
    const limit = req.body.limit || 20;
    const lifelogParams: any = {
      apiKey,
      timezone,
      includeMarkdown: true,
      includeHeadings: false,
      limit,
      start,
      end
    };
    if (typeof isStarred === 'boolean') lifelogParams.isStarred = isStarred;

    let lifelogs: any[] = [];
    try {
      lifelogs = await getLifelogs(lifelogParams);
      console.log(`[MEMORY] Lifelogs returned: ${lifelogs.length}`);
    } catch (apiErr) {
      console.error('Error fetching lifelogs from Limitless API:', apiErr);
      let details = '';
      if (apiErr instanceof Error) {
        details = apiErr.message;
      } else if (typeof apiErr === 'object' && apiErr && 'message' in apiErr) {
        details = (apiErr as any).message;
      } else {
        details = String(apiErr);
      }
      return res.status(502).json({ error: 'Failed to fetch lifelogs from Limitless API', details });
    }

    // 4. If no logs are found, return a clear fallback message instead of calling OpenAI
    if (!lifelogs.length) {
      console.log('[MEMORY] No lifelogs found for range:', logDateRange);
      return res.json({ result: `No memory available for that time range or topic.\n(Time range used: ${start} to ${end} in ${timezone})` });
    }

    // 5. If logs are found, concatenate markdowns and split into safe chunks
    const maxLifelogsForPrompt = 50; // allow more logs for chunking
    const logsForPrompt = lifelogs.slice(0, maxLifelogsForPrompt);
    const combinedMarkdown = logsForPrompt.map((log: any) => log.markdown || '').join('\n---\n');
    const chunkSize = 12000; // ~3000 tokens
    const chunks = splitMarkdownIntoChunks(combinedMarkdown, chunkSize);
    console.log(`[MEMORY] Splitting logs into ${chunks.length} chunk(s) of up to ${chunkSize} chars each.`);
    if (!chunks.length) {
      return res.json({ result: 'No usable memory content for summarisation.' });
    }


    // 6. Summarise each chunk with OpenAI, handling rate limits
    // The userPrompt is now more structured and instructs the model to use headings, bullets, and highlight key details.
    const partialSummaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk.trim()) continue;
      // Improved user prompt for chunk summarisation
      const userPrompt = `
Please summarize the following lifelog entries for the user. Structure your summary as follows:

1. For each meeting or key conversation, use a clear section heading (include names, titles, or times if available).
2. Under each heading, use bullet points for:
   - Topics discussed
   - Decisions made
   - Action items (with who is responsible, if known)
   - Emotional tone or points of tension

Be concise, friendly, and professional. If multiple meetings are present, use a separate heading for each. Avoid repetition. Make the summary easy to scan for an executive.

---
Lifelog entries:
${chunk}

User question: ${prompt}
`;
      let retries = 0;
      let maxRetries = 3;
      let success = false;
      let partial = '';
      while (!success && retries <= maxRetries) {
        try {
          if (i > 0) await sleep(1000); // 1s delay between chunks
          console.log(`[MEMORY] Sending chunk ${i+1}/${chunks.length} to OpenAI (${chunk.length} chars)`);
          const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 800
          });
          partial = completion.choices[0]?.message?.content?.trim() || '';
          if (partial) partialSummaries.push(partial);
          else console.warn(`[MEMORY] Empty summary for chunk ${i+1}`);
          success = true;
        } catch (err: any) {
          if (err.status === 429) {
            let retryAfter = 10000; // default 10s
            if (err.response && err.response.headers && err.response.headers['retry-after']) {
              const ra = err.response.headers['retry-after'];
              if (!isNaN(Number(ra))) retryAfter = Number(ra) * (Number(ra) < 1000 ? 1000 : 1);
            }
            retries++;
            console.warn(`[MEMORY] Rate limited on chunk ${i+1}, retrying in ${retryAfter}ms (attempt ${retries})`);
            await sleep(retryAfter);
          } else {
            console.error(`[MEMORY] Failed to summarise chunk ${i+1}:`, err);
            break;
          }
        }
      }
      if (!success) {
        console.error(`[MEMORY] Giving up on chunk ${i+1} after ${retries} retries.`);
      }
    }
    console.log(`[MEMORY] Got ${partialSummaries.length} partial summaries.`);
    if (!partialSummaries.length) {
      return res.json({ result: 'No summary could be generated from the memory content.' });
    }

    // 7. Final summary from partials
    // The finalPrompt now instructs the model to merge chunk summaries with clear structure and headings.
    const finalPrompt = `
You are an executive assistant. Merge the following partial summaries into a single, well-organized summary for the user. 

Instructions:
- Use a section heading for each meeting or conversation (include names/times if available)
- Under each heading, use bullet points for topics, decisions, action items (with responsible people), and emotional tone
- Be concise, friendly, and professional
- Avoid repetition and make the summary easy to scan

---
Partial summaries:
${partialSummaries.map((s, i) => `Summary part ${i+1}:
${s}`).join('\n\n')}
`;
    try {
      console.log(`[MEMORY] Sending ${partialSummaries.length} partials to OpenAI for final summary.`);
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: finalPrompt }
        ],
        max_tokens: 600
      });
      const finalSummary = completion.choices[0]?.message?.content?.trim() || '';
      console.log(`[MEMORY] Final summary length: ${finalSummary.length} chars`);
      return res.json({ result: finalSummary });
    } catch (err) {
      console.error('[MEMORY] Final summary failed:', err);
      return res.json({ result: partialSummaries.join('\n\n') });
    }
  } catch (err) {
    console.error('Error in /memory:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Lifelog sync on startup ---
async function syncLifelogs() {
  const apiKey = process.env.LIMITLESS_API_KEY || '';
  if (!apiKey) {
    console.warn('[SYNC] LIMITLESS_API_KEY not set, skipping lifelog sync.');
    return;
  }
  try {
    const lifelogs = await getLifelogs({ apiKey, limit: null });
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
    console.log(`[SYNC] Synced ${count} lifelogs from Limitless API to SQLite.`);
  } catch (err) {
    console.error('[SYNC] Failed to sync lifelogs:', err);
  }
}

// Call syncLifelogs on server startup
syncLifelogs();

// Optional: /refresh route to trigger sync manually
app.post('/refresh', async (req, res) => {
  await syncLifelogs();
  res.json({ result: 'Lifelogs refreshed from Limitless API.' });
});




const PORT = process.env.PORT || 3000;

// Warn if required environment variables are missing
if (!process.env.LIMITLESS_API_KEY) {
  console.warn('Warning: LIMITLESS_API_KEY is not set in environment variables.');
}
if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set in environment variables.');
}



console.log("Using Limitless API Key:", process.env.LIMITLESS_API_KEY?.slice(0, 8));




// POST /search route
// This route receives a JSON body with:
// - `query`: the search text
// - `date`: optional date to filter logs (YYYY-MM-DD)
// - `timezone`: optional timezone (e.g., "Australia/Melbourne")
// - `limit`: optional max number of lifelogs to load
// It loads lifelogs using getLifelogs(), uses Fuse.js to fuzzy search them,
// and returns matching entries with relevance score and content snippet.
// Use proper async/await and avoid typing errors with TS2769.




// MCP /search endpoint: returns relevant lifelog entries for deep research


// MCP /search endpoint: returns relevant lifelog entries for deep research (calls Limitless API directly)
app.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Missing query' });
    }

    const apiKey = process.env.LIMITLESS_API_KEY || '';
    if (!apiKey) return res.status(500).json({ error: 'API key missing' });

    // Fetch lifelogs from Limitless API (first 50, adjust as needed)
    const lifelogs = await getLifelogs({ apiKey, limit: 50 });

    // Filter results for the query (simple keyword match)
    const results = lifelogs
      .filter(log =>
        (log.title && log.title.toLowerCase().includes(query.toLowerCase())) ||
        (log.markdown && log.markdown.toLowerCase().includes(query.toLowerCase()))
      )
      .map(log => {
        let snippet = '';
        if (typeof log.markdown === 'string') {
          snippet = log.markdown.length > 200 ? log.markdown.slice(0, 200) + '...' : log.markdown;
        }
        return {
          id: log.id,
          title: log.title,
          text: snippet,
          url: `https://app.limitless.ai/lifelogs/${log.id}`
        };
      });

    res.json({ results });
  } catch (err) {
    console.error('Error in /search:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// MCP /fetch endpoint: returns full content for a given lifelog id (calls Limitless API directly)
app.post('/fetch', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing id' });
    }

    const apiKey = process.env.LIMITLESS_API_KEY || '';
    if (!apiKey) return res.status(500).json({ error: 'API key missing' });

    const log = await getLifelogById({ apiKey, id });
    if (!log) return res.status(404).json({ error: 'Not found' });

    res.json({
      id: log.id,
      title: log.title,
      text: log.markdown,
      url: `https://app.limitless.ai/lifelogs/${log.id}`,
      metadata: {
        startTime: log.startTime,
        endTime: log.endTime,
        updatedAt: log.updatedAt
      }
    });
  } catch (err) {
    console.error('Error in /fetch:', err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});


app.get('/', (req, res) => {

  res.send('✅ Limitless MCP server running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
