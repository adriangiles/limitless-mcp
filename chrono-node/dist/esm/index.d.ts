import * as en from "./locales/en/index.js";
import { Chrono, Parser, ParsingContext, Refiner } from "./chrono.js";
import { ParsingResult, ParsingComponents, ReferenceWithTimezone } from "./results.js";
import { Component, ParsedComponents, ParsedResult, ParsingOption, ParsingReference, Meridiem, Weekday } from "./types.js";
export { en, Chrono, Parser, ParsingContext, Refiner, ParsingResult, ParsingComponents, ReferenceWithTimezone };
export { Component, ParsedComponents, ParsedResult, ParsingOption, ParsingReference, Meridiem, Weekday };
import * as de from "./locales/de/index.js";
import * as fr from "./locales/fr/index.js";
import * as ja from "./locales/ja/index.js";
import * as pt from "./locales/pt/index.js";
import * as nl from "./locales/nl/index.js";
import * as zh from "./locales/zh/index.js";
import * as ru from "./locales/ru/index.js";
import * as es from "./locales/es/index.js";
import * as uk from "./locales/uk/index.js";
export { de, fr, ja, pt, nl, zh, ru, es, uk };
export declare const strict: en.Chrono;
export declare const casual: en.Chrono;
export declare function parse(text: string, ref?: ParsingReference | Date, option?: ParsingOption): ParsedResult[];
export declare function parseDate(text: string, ref?: ParsingReference | Date, option?: ParsingOption): Date | null;
