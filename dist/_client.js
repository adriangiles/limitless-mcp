"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLifelogById = getLifelogById;
exports.getLifelogs = getLifelogs;
// Fetch a single lifelog by ID from the Limitless API
async function getLifelogById({ apiKey, id, apiUrl = process.env.LIMITLESS_API_URL || "https://api.limitless.ai", endpoint = "v1/lifelogs", includeMarkdown = true, includeHeadings = false }) {
    try {
        const params = {
            includeMarkdown: includeMarkdown.toString(),
            includeHeadings: includeHeadings.toString(),
        };
        const response = await axios_1.default.get(`${apiUrl}/${endpoint}/${id}`, {
            headers: { "X-API-Key": apiKey },
            params,
        });
        return response.data.data.lifelog;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        throw error;
    }
}
const axios_1 = __importDefault(require("axios"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
async function getLifelogs({ apiKey, apiUrl = process.env.LIMITLESS_API_URL || "https://api.limitless.ai", endpoint = "v1/lifelogs", limit = 50, batchSize = 10, includeMarkdown = true, includeHeadings = false, date, timezone, direction = "asc", }) {
    const allLifelogs = [];
    let cursor;
    // If limit is null, fetch all available lifelogs
    // Otherwise, set a batch size and fetch until we reach the limit
    if (limit !== null) {
        batchSize = Math.min(batchSize, limit);
    }
    while (true) {
        const params = {
            limit: batchSize.toString(),
            includeMarkdown: includeMarkdown.toString(),
            includeHeadings: includeHeadings.toString(),
            direction,
            timezone: timezone || moment_timezone_1.default.tz.guess(),
        };
        if (date) {
            params.date = date;
        }
        if (cursor) {
            params.cursor = cursor;
        }
        try {
            const response = await axios_1.default.get(`${apiUrl}/${endpoint}`, {
                headers: { "X-API-Key": apiKey },
                params,
            });
            const lifelogs = response.data.data.lifelogs;
            // Add transcripts from this batch
            allLifelogs.push(...lifelogs);
            // Check if we've reached the requested limit
            if (limit !== null && allLifelogs.length >= limit) {
                return allLifelogs.slice(0, limit);
            }
            // Get the next cursor from the response
            const nextCursor = response.data.meta.lifelogs.nextCursor;
            // If there's no next cursor or we got fewer results than requested, we're done
            if (!nextCursor || lifelogs.length < batchSize) {
                break;
            }
            console.log(`Fetched ${lifelogs.length} lifelogs, next cursor: ${nextCursor}`);
            cursor = nextCursor;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`HTTP error! Status: ${error.response?.status}`);
            }
            throw error;
        }
    }
    return allLifelogs;
}
