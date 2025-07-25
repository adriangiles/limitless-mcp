"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const db_1 = __importDefault(require("./db"));
const _client_1 = require("./_client");
const openai_1 = __importDefault(require("openai"));
const memory_utils_1 = require("./memory_utils");
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
// Only create OpenAI client once
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
// POST /memory endpoint for conversational memory queries
app.post('/memory', async (req, res) => {
    try {
        // Accept either 'prompt' or 'query' as the input field (for Custom GPT compatibility)
        // This allows GPTs that send 'query' instead of 'prompt' to work
        const prompt = req.body.prompt || req.body.query;
        // Fallback to 400 error if neither is present
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid prompt/query' });
        }
        // Fallback for 'date': if missing or empty, default to today's date (YYYY-MM-DD) in server's timezone
        let date = req.body.date;
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
        let timezone = req.body.timezone;
        if (!timezone) {
            timezone = 'Australia/Melbourne';
            // Inline comment: fallback to 'Australia/Melbourne' if 'timezone' is missing
        }
        // 1. Log the parsed input (prompt, date, timezone)
        console.log('Received /memory request:', { prompt, date, timezone });
        // 2. Ensure we are querying the local lifelogs.db (not the Limitless API)
        // (queryRelevantLifelogs uses the local db instance)
        // Parse the prompt for time range and topics
        const { timeRange, keywords } = (0, memory_utils_1.parseMemoryQuery)(prompt);
        console.log('Parsed timeRange:', timeRange);
        console.log('Extracted keywords:', keywords);
        // Query relevant lifelogs from SQLite
        const lifelogs = (0, memory_utils_1.queryRelevantLifelogs)(db_1.default, { timeRange, keywords, limit: 20 });
        console.log('Lifelogs returned from DB:', lifelogs.length);
        if (lifelogs.length > 0) {
            console.log('Sample lifelog(s):', lifelogs.slice(0, 2));
        }
        // 3. Print the number of logs and the summary input text
        const userPrompt = `Here are some lifelog entries:\n\n${lifelogs
            .map((log) => `Title: ${log.title}\nTime: ${log.startTime}\n${log.markdown}`)
            .join('\n---\n')}\n\nUser question: ${prompt}\n\nSummarize the relevant information in a clear, conversational way.`;
        console.log('Summary input text for OpenAI:', userPrompt);
        // Define a good default system prompt for OpenAI summarisation
        const systemPrompt = 'You are a helpful memory assistant. Given a set of lifelog entries and a user question, provide a clear, concise, and conversational summary of the most relevant information.';
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
    }
    catch (err) {
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
        if (!apiKey)
            return res.status(500).json({ error: 'API key missing' });
        // Fetch lifelogs from Limitless API (first 50, adjust as needed)
        const lifelogs = await (0, _client_1.getLifelogs)({ apiKey, limit: 50 });
        // Filter results for the query (simple keyword match)
        const results = lifelogs
            .filter(log => (log.title && log.title.toLowerCase().includes(query.toLowerCase())) ||
            (log.markdown && log.markdown.toLowerCase().includes(query.toLowerCase())))
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
    }
    catch (err) {
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
        if (!apiKey)
            return res.status(500).json({ error: 'API key missing' });
        const log = await (0, _client_1.getLifelogById)({ apiKey, id });
        if (!log)
            return res.status(404).json({ error: 'Not found' });
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
    }
    catch (err) {
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
