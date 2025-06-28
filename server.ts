import express from 'express';
import bodyParser from 'body-parser';
import db from './db';
import OpenAI from 'openai';
import { parseMemoryQuery, queryRelevantLifelogs } from './memory_utils';

const app = express();
app.use(bodyParser.json());

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

    // Fallback for 'date': if missing or empty, default to today's date (YYYY-MM-DD) in server's timezone
    let date: string = req.body.date;
    if (!date) {
      // Use server's current date in YYYY-MM-DD format
      const now = new Date();
      // Pad month and day for two digits
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      date = `${yyyy}-${mm}-${dd}`;
      // Inline comment: fallback to today's date if 'date' is missing
    }

    // Fallback for 'timezone': if missing, default to 'Australia/Melbourne'
    let timezone: string = req.body.timezone;
    if (!timezone) {
      timezone = 'Australia/Melbourne';
      // Inline comment: fallback to 'Australia/Melbourne' if 'timezone' is missing
    }

    // 1. Log the parsed input (prompt, date, timezone)
    console.log('Received /memory request:', { prompt, date, timezone });




    // 2. Ensure we are querying the local lifelogs.db (not the Limitless API)
    // (queryRelevantLifelogs uses the local db instance)

    // Parse the prompt for time range and topics
    const { timeRange, keywords } = parseMemoryQuery(prompt);
    console.log('Parsed timeRange:', timeRange);
    console.log('Extracted keywords:', keywords);

    // Query relevant lifelogs from SQLite
    const lifelogs = queryRelevantLifelogs(db, { timeRange, keywords, limit: 20 });
    console.log('Lifelogs returned from DB:', lifelogs.length);
    if (lifelogs.length > 0) {
      console.log('Sample lifelog(s):', lifelogs.slice(0, 2));
    }


    // 3. Print the number of logs and the summary input text
    const userPrompt =
      `Here are some lifelog entries:\n\n${lifelogs
        .map(
          (log: any) =>
            `Title: ${log.title}\nTime: ${log.startTime}\n${log.markdown}`
        )
        .join('\n---\n')}\n\nUser question: ${prompt}\n\nSummarize the relevant information in a clear, conversational way.`;
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



app.post('/search', async (req, res) => {
  try {
    const { query, date, timezone, limit = 50 } = req.body;

    if (!query) {
      res.status(400).json({ error: 'Missing search query' });
      return;
    }

    // ...existing code...
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
    return;
  }
});


app.get('/', (req, res) => {

  res.send('✅ Limitless MCP server running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
