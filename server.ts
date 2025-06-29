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

    // 5. If logs are found, concatenate markdowns and pass them to OpenAI with a clear summarisation prompt
    const maxLifelogsForPrompt = 10;
    const logsForPrompt = lifelogs.slice(0, maxLifelogsForPrompt);
    const combinedMarkdown = logsForPrompt.map((log: any) => log.markdown || '').join('\n---\n');
    const userPrompt =
      `Here are your lifelog entries for the requested time range. Please summarise them for the user.\n\n` +
      `${combinedMarkdown}\n\n` +
      `User question: ${prompt}\n\n` +
      `Instructions:\n` +
      `- Return a summary in bullet points\n` +
      `- List key discussion topics\n` +
      `- Highlight any decisions or action items\n` +
      `- Optionally, note the emotional tone if relevant\n` +
      `- Be clear, concise, and helpful\n`;

    // 6. Log the number of lifelogs, characters/tokens, and prompt preview
    console.log(`[MEMORY] Preparing summary for ${lifelogs.length} lifelogs, ${combinedMarkdown.length} chars`);
    console.log('[MEMORY] OpenAI prompt preview:', userPrompt.slice(0, 500));

    // 7. Call OpenAI to generate the summary
    const systemPrompt =
      'You are a helpful memory assistant. Given a set of lifelog entries and a user question, provide a clear, concise, and conversational summary of the most relevant information. Include bullet points, key topics, decisions, and emotional tone if relevant.';
    let summary = '';
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 400
      });
      summary = completion.choices[0]?.message?.content?.trim() || '';
    } catch (aiErr) {
      console.error('[MEMORY] OpenAI summarisation failed:', aiErr);
      let details = '';
      if (aiErr instanceof Error) {
        details = aiErr.message;
      } else if (typeof aiErr === 'object' && aiErr && 'message' in aiErr) {
        details = (aiErr as any).message;
      } else {
        details = String(aiErr);
      }
      return res.status(502).json({ error: 'Failed to generate summary', details });
    }

    // 8. Return the summary as { result }
    res.json({ result: summary });
  } catch (err) {
    console.error('Error in /memory:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
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
