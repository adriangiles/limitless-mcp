


import Fuse from 'fuse.js';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { getLifelogs } from './_client';
import * as chrono from 'chrono-node';
// Helper function to parse natural language date or time range using chrono-node
// Returns an ISO date string (YYYY-MM-DD) if possible, otherwise undefined
function parseDateInput(dateInput?: string): string | undefined {
  if (!dateInput || typeof dateInput !== 'string' || !dateInput.trim()) return undefined;
  // Use chrono-node to parse the date string
  const parsed = chrono.parse(dateInput.trim());
  if (parsed && parsed.length > 0) {
    // Get the start date of the first parsed result
    const dateObj = parsed[0].start.date();
    // Format as YYYY-MM-DD
    return dateObj.toISOString().slice(0, 10);
  }
  return undefined;
}
import OpenAI from 'openai';


dotenv.config();
const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

console.log("Using Limitless API Key:", process.env.LIMITLESS_API_KEY?.slice(0, 8));

// POST /query route with topic-focused summarisation
// Users can pass a "focus" string in the request body to influence the summary topic
app.post('/query', async (req, res) => {
  try {
    // Destructure prompt, focus, date, timeRange, speaker, and mode from the request body
    const { prompt, focus, date, timeRange, speaker, mode } = req.body;

    // Parse date or timeRange using chrono-node (natural language support)
    // If both are provided, prefer timeRange
    const parsedDate = parseDateInput(timeRange || date);

    // If a date is parsed, use it; otherwise, default to last 10 lifelogs
    const lifelogParams: any = {
      apiKey: process.env.LIMITLESS_API_KEY!,
      limit: parsedDate ? undefined : 10,
    };
    if (parsedDate) lifelogParams.date = parsedDate;

    // Fetch lifelogs with date filtering if available
    const lifelogs = await getLifelogs(lifelogParams);

    // Speaker-specific filtering logic
    let filteredMarkdowns: string[] = [];
    if (speaker && typeof speaker === 'string' && speaker.trim().length > 0) {
      filteredMarkdowns = lifelogs
        .filter(log => {
          if (log.speaker && typeof log.speaker === 'string') {
            return log.speaker.trim().toLowerCase() === speaker.trim().toLowerCase();
          }
          return false;
        })
        .map(log => log.markdown)
        .filter((md): md is string => typeof md === 'string');
      if (filteredMarkdowns.length === 0) {
        for (const log of lifelogs) {
          if (!log.markdown) continue;
          const blocks = log.markdown.split(/\n{2,}/g);
          const matchingBlocks = blocks.filter(block => {
            const match = block.match(/\*\*?Speaker:?\*\*?\s*([\w ]+)/i) || block.match(/Speaker:?\s*([\w ]+)/i);
            if (match) {
              return match[1].trim().toLowerCase() === speaker.trim().toLowerCase();
            }
            return false;
          });
          if (matchingBlocks.length > 0) {
            filteredMarkdowns.push(matchingBlocks.join('\n\n'));
          }
        }
      }
    } else {
      filteredMarkdowns = lifelogs.map(log => log.markdown).filter((md): md is string => typeof md === 'string');
    }

    // Prepare markdown chunks as before
    const chunks = [] as string[];
    let currentChunk = '';
    const maxChars = 6000;
    for (const md of filteredMarkdowns) {
      if (md && (currentChunk.length + md.length) > maxChars) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      currentChunk += `\n\n${md}`;
    }
    if (currentChunk) chunks.push(currentChunk);

    // Sentiment/reflection mode logic
    const reflectiveModes = ['reflective', 'emotional', 'insight'];
    const isReflective = mode && typeof mode === 'string' && reflectiveModes.includes(mode.toLowerCase());

    // Build the system prompt
    let systemPrompt = `You are a helpful assistant summarising personal lifelogs.`;
    if (focus && typeof focus === 'string' && focus.trim().length > 0) {
      systemPrompt += ` Focus specifically on: ${focus.trim()}.`;
    }
    if (isReflective) {
      systemPrompt += ` Your job is to detect and highlight emotional tone, uncertainty, frustration, excitement, and moments of advice or decision-making. Provide a structured summary with sections for tone, insights, and notable reactions.`;
    }

    // Summarise each chunk
    const summaries: string[] = [];
    for (const chunk of chunks) {
      let userPrompt = '';
      if (isReflective) {
        userPrompt = `${prompt ? prompt + '\n\n' : ''}Please analyse the following lifelog content. Identify the emotional tone, highlight uncertainty, frustration, excitement, and any moments of advice or decision-making. Return a JSON object with keys: tone, insights, notableReactions.\n\n${chunk}`;
      } else {
        userPrompt = focus && typeof focus === 'string' && focus.trim().length > 0
          ? `${prompt ? prompt + '\n\n' : ''}Focus on: ${focus.trim()}\n\n${chunk}`
          : `${prompt ? prompt + '\n\n' : ''}${chunk}`;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });
      summaries.push(response.choices[0].message?.content ?? '');
    }

    // Final summarisation of summaries
    let finalUserPrompt = '';
    if (isReflective) {
      finalUserPrompt = `Based on the following chunk-level analyses (in JSON), merge and summarise the overall emotional tone, insights, and notable reactions. Return a single JSON object with keys: tone, insights, notableReactions.\n\n${summaries.join('\n\n')}`;
    } else {
      finalUserPrompt = focus && typeof focus === 'string' && focus.trim().length > 0
        ? `Based on these summaries, write a final summary focused on: ${focus.trim()}\n\n${summaries.join('\n\n')}`
        : `Based on these summaries, write a final summary:\n\n${summaries.join('\n\n')}`;
    }

    const finalResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: finalUserPrompt }
      ]
    });

    const output = finalResponse.choices[0]?.message?.content;

    // If reflective mode, try to parse the output as JSON and return structured summary
    if (isReflective) {
      try {
        const structured = typeof output === 'string' ? JSON.parse(output) : output;
        res.json({ summary: structured });
        return;
      } catch (e) {
        // If parsing fails, return raw output
        res.json({ summary: output, warning: 'Could not parse structured summary as JSON.' });
        return;
      }
    }

    res.json({ result: output });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error processing request' });
  }
});


// POST /search route
// This route receives a JSON body with:
// - `query`: the search text
// - `date`: optional date to filter logs (YYYY-MM-DD)
// - `timezone`: optional timezone (e.g., "Australia/Melbourne")
// - `limit`: optional max number of lifelogs to load
// It loads lifelogs using getLifelogs(), uses Fuse.js to fuzzy search them,
// and returns matching entries with relevance score and content snippet.
// Use proper async/await and avoid typing errors with TS2769.



app.post('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, date, timezone, limit = 50 } = req.body;

    if (!query) {
      res.status(400).json({ error: 'Missing search query' });
      return;
    }

    const lifelogs = await getLifelogs({
      apiKey: process.env.LIMITLESS_API_KEY!,
      date,
      timezone,
      limit
    });

    const fuse = new Fuse(lifelogs, {
      includeScore: true,
      threshold: 0.4,
      keys: ['title', 'markdown']
    });

    const results = fuse.search(query).map(result => ({
      id: result.item.id,
      title: result.item.title,
      score: result.score,
      snippet: result.item.markdown?.slice(0, 300) || ''
    }));

    res.json({ results });
    return;
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
