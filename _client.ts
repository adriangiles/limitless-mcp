// Fetch a single lifelog by ID from the Limitless API
/**
 * Fetch a single lifelog by ID from the Limitless API.
 * @param apiKey - Your Limitless API key (required)
 * @param id - The lifelog ID to fetch (required)
 * @param apiUrl - Base API URL (default: https://api.limitless.ai)
 * @param endpoint - API endpoint (default: v1/lifelogs)
 * @param includeMarkdown - Whether to include markdown (default: true)
 * @param includeHeadings - Whether to include headings (default: false)
 */
export async function getLifelogById({
  apiKey,
  id,
  apiUrl = process.env.LIMITLESS_API_URL || "https://api.limitless.ai",
  endpoint = "v1/lifelogs",
  includeMarkdown = true,
  includeHeadings = false
}: {
  apiKey: string;
  id: string;
  apiUrl?: string;
  endpoint?: string;
  includeMarkdown?: boolean;
  includeHeadings?: boolean;
}): Promise<any | null> {
  // Validate required parameters
  if (!apiKey) throw new Error("Missing Limitless API key");
  if (!id) throw new Error("Missing lifelog ID");
  try {
    // Build query params
    const params: Record<string, string> = {
      includeMarkdown: includeMarkdown.toString(),
      includeHeadings: includeHeadings.toString(),
    };
    // Make GET request with authentication header
    const response = await axios.get(`${apiUrl}/${endpoint}/${id}`, {
      headers: { "X-API-Key": apiKey },
      params,
    });
    // Return the lifelog object
    return response.data.data.lifelog;
  } catch (error) {
    // Handle 404 (not found) gracefully
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    // Rethrow other errors
    throw error;
  }
}
import axios from "axios";
import moment from "moment-timezone";

interface Lifelog {
  markdown?: string;
  [key: string]: any;
}

interface Meta {
  lifelogs: {
    nextCursor?: string;
  };
}

interface Response {
  data: {
    lifelogs: Lifelog[];
  };
  meta: Meta;
}

/**
 * Fetch lifelogs from the Limitless API with robust options and error handling.
 * @param apiKey - Your Limitless API key (required)
 * @param apiUrl - Base API URL (default: https://api.limitless.ai)
 * @param endpoint - API endpoint (default: v1/lifelogs)
 * @param limit - Max number of lifelogs to fetch (null for all)
 * @param batchSize - Number of lifelogs per request (default: 10)
 * @param includeMarkdown - Whether to include markdown (default: true)
 * @param includeHeadings - Whether to include headings (default: false)
 * @param date - Filter by date (YYYY-MM-DD)
 * @param timezone - IANA timezone (default: guessed from system)
 * @param direction - Sort direction (asc/desc)
 * @returns Array of lifelog objects
 */
export async function getLifelogs({
  apiKey,
  apiUrl = process.env.LIMITLESS_API_URL || "https://api.limitless.ai",
  endpoint = "v1/lifelogs",
  limit = 50,
  batchSize = 10,
  includeMarkdown = true,
  includeHeadings = false,
  date,
  timezone,
  direction = "asc",
}: {
  apiKey: string;
  apiUrl?: string;
  endpoint?: string;
  limit?: number | null;
  batchSize?: number;
  includeMarkdown?: boolean;
  includeHeadings?: boolean;
  date?: string;
  timezone?: string;
  direction?: "asc" | "desc";
}): Promise<Lifelog[]> {
  // Validate required parameters
  if (!apiKey) throw new Error("Missing Limitless API key");

  const allLifelogs: Lifelog[] = [];
  let cursor: string | undefined;

  // If limit is null, fetch all available lifelogs; otherwise, set batch size
  if (limit !== null) {
    batchSize = Math.min(batchSize, limit);
  }

  while (true) {
    // Build query params for this batch
    const params: Record<string, string> = {
      limit: batchSize.toString(),
      includeMarkdown: includeMarkdown.toString(),
      includeHeadings: includeHeadings.toString(),
      direction,
      timezone: timezone || moment.tz.guess(),
    };
    if (date) {
      params.date = date;
    }
    if (cursor) {
      params.cursor = cursor;
    }

    try {
      // Make GET request with authentication header
      const response = await axios.get<Response>(`${apiUrl}/${endpoint}`, {
        headers: { "X-API-Key": apiKey },
        params,
      });

      const lifelogs = response.data.data.lifelogs;

      // Add lifelogs from this batch
      allLifelogs.push(...lifelogs);

      // Check if we've reached the requested limit
      if (limit !== null && allLifelogs.length >= limit) {
        return allLifelogs.slice(0, limit);
      }

      // Get the next cursor for pagination
      const nextCursor = response.data.meta.lifelogs.nextCursor;

      // If there's no next cursor or we got fewer results than requested, we're done
      if (!nextCursor || lifelogs.length < batchSize) {
        break;
      }

      // Log progress for debugging
      console.log(
        `Fetched ${lifelogs.length} lifelogs, next cursor: ${nextCursor}`
      );
      cursor = nextCursor;
    } catch (error) {
      // Handle HTTP/network errors
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid or missing API key (401 Unauthorized)");
        }
        if (error.response?.status === 400) {
          throw new Error("Invalid request parameters (400 Bad Request)");
        }
        throw new Error(`HTTP error! Status: ${error.response?.status}`);
      }
      // Rethrow other errors
      throw error;
    }
  }

  return allLifelogs;
}
