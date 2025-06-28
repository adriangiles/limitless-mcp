# Limitless MCP Server

This is a Node.js/Express server for summarizing and searching personal lifelogs using OpenAI and Limitless APIs.

## Setup

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Set environment variables:**
   - Copy `example.env` to `.env` and fill in your API keys, or set them in your shell environment.

3. **Run the server:**
   ```sh
   npm start
   ```

## Environment Variables
- `LIMITLESS_API_KEY` (required)
- `OPENAI_API_KEY` (required)
- `PORT` (optional, default: 3000)

## Endpoints
- `POST /query` — Summarize lifelogs (see code for options)
- `POST /search` — Fuzzy search lifelogs

---
**Do not commit your real `.env` file!**
