"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMemoryQuery = parseMemoryQuery;
exports.queryRelevantLifelogs = queryRelevantLifelogs;
const chrono = __importStar(require("chrono-node"));
const fuse_js_1 = __importDefault(require("fuse.js"));
// Parse a natural language memory question for time range and keywords
function parseMemoryQuery(question) {
    // Use chrono-node to parse dates
    // Fallback: if question is empty, use 'today' as a default
    const results = chrono.parse(question || 'today');
    let start = null;
    let end = null;
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
function queryRelevantLifelogs(db, opts) {
    const { timeRange, keywords, limit = 20 } = opts;
    let sql = 'SELECT * FROM lifelogs';
    const params = [];
    const where = [];
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
    if (!keywords.length)
        return rows;
    // Fuzzy match on title/markdown using Fuse.js
    const fuse = new fuse_js_1.default(rows, {
        keys: ['title', 'markdown'],
        threshold: 0.4,
        minMatchCharLength: 2
    });
    const results = fuse.search(keywords.join(' '));
    return results.map(r => r.item);
}
