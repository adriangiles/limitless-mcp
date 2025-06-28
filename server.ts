
import express from 'express';
import bodyParser from 'body-parser';
import db from './db';
import { getLifelogs, getLifelogById } from './_client';
import OpenAI from 'openai';
import { parseMemoryQuery, queryRelevantLifelogs } from './memory_utils';
import chrono from 'chrono-node';
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


    // Accept either 'prompt' or 'query' as the input field (for Custom GPT compatibility)
    // This allows GPTs that send 'query' instead of 'prompt' to work
    const prompt: string = req.body.prompt || req.body.query;
    // Fallback to 400 error if neither is present
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid prompt/query' });
    }


    // Advanced natural language date and range parsing using chrono-node
    const moment = require('moment-timezone');
    let date: string = req.body.date;
    let start: string | undefined = undefined;
    let end: string | undefined = undefined;
    const timezone: string = req.body.timezone || 'Australia/Melbourne';
    if (!date) {
      // Default to today
      date = moment().tz(timezone).format('YYYY-MM-DD');
    } else {
      // Try to parse date or range using chrono-node
      const parsed = chrono.parse(date, new Date(), { forwardDate: true });
      if (parsed.length > 0) {
        const range = parsed[0];
        if (range.start) {
          start = moment(range.start.date()).tz(timezone).format('YYYY-MM-DD');
        }
        if (range.end) {
          end = moment(range.end.date()).tz(timezone).format('YYYY-MM-DD');
        }
        if (!end && start) {
          // If only a single date, treat as 'date'
          date = start;
        } else if (start && end) {
          // If a range, clear 'date' and use start/end
          date = '';
        }
      } else {
        // fallback: use today's date
        date = moment().tz(timezone).format('YYYY-MM-DD');
      }
    }




    // 1. Log the parsed input (prompt, date, timezone, start, end)
    console.log('Received /memory request:', { prompt, date, timezone, start, end });





    // 2. Query lifelogs from the Limitless API (not the local DB)
    const apiKey = process.env.LIMITLESS_API_KEY || '';
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing Limitless API key' });
    }


    // Support additional filters from the request (isStarred, limit, etc.)
    const isStarred = req.body.isStarred;
    const limit = req.body.limit || 20;

    // Build query params for Limitless API
    const lifelogParams: any = {
      apiKey,
      timezone,
      includeMarkdown: true,
      includeHeadings: false,
      limit,
    };
    if (date) lifelogParams.date = date;
    if (start) lifelogParams.start = start;
    if (end) lifelogParams.end = end;
    if (typeof isStarred === 'boolean') lifelogParams.isStarred = isStarred;

    let lifelogs: any[] = [];
    try {
      lifelogs = await getLifelogs(lifelogParams);
      console.log('Lifelogs returned from Limitless API:', lifelogs.length);
      if (lifelogs.length > 0) {
        console.log('Sample lifelog(s):', lifelogs.slice(0, 2));
      }
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


    // 3. Print the number of logs and the summary input text
    // Enrich prompt with tags, starred, and support for pagination (showing only the first N if too many)
    const maxLifelogsForPrompt = 10;
    let lifelogText = lifelogs.slice(0, maxLifelogsForPrompt).map((log: any) => {
      let meta = [];
      if (log.isStarred) meta.push('⭐ Starred');
      if (log.tags && Array.isArray(log.tags) && log.tags.length > 0) meta.push(`Tags: ${log.tags.join(', ')}`);
      return [
        `Title: ${log.title}`,
        `Time: ${log.startTime}`,
        meta.length ? meta.join(' | ') : '',
        log.markdown
      ].filter(Boolean).join('\n');
    }).join('\n---\n');

    if (lifelogs.length > maxLifelogsForPrompt) {
      lifelogText += `\n\n(Note: Only the first ${maxLifelogsForPrompt} of ${lifelogs.length} lifelogs are shown here.)`;
    }

    const userPrompt =
      `Here are some lifelog entries:\n\n${lifelogText}\n\nUser question: ${prompt}\n\nSummarize the relevant information in a clear, conversational way.`;
    console.log('Summary input text for OpenAI:', userPrompt);

    // Define a good default system prompt for OpenAI summarisation
    const systemPrompt =
      'You are a helpful memory assistant. Given a set of lifelog entries and a user question, provide a clear, concise, and conversational summary of the most relevant information.';

    // 4. Return the summary input text directly to confirm data flow (TEMPORARY: comment out to enable OpenAI call)
    // return res.json({ result: userPrompt });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 400
    });

    const summary = completion.choices[0]?.message?.content?.trim() || '';
    // Respond with { result } to match OpenAPI spec and Custom GPT expectations
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
