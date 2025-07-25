import { Chrono, Configuration, Parser, Refiner } from "../../../chrono";
import { ParsingResult, ParsingComponents, ReferenceWithTimezone } from "../../../results";
import { Component, ParsedResult, ParsingOption, ParsingReference, Meridiem, Weekday } from "../../../types";
export { Chrono, Parser, Refiner, ParsingResult, ParsingComponents, ReferenceWithTimezone };
export { Component, ParsedResult, ParsingOption, ParsingReference, Meridiem, Weekday };
export declare const hant: Chrono;
export declare const casual: Chrono;
export declare const strict: Chrono;
export declare function parse(text: string, ref?: ParsingReference | Date, option?: ParsingOption): ParsedResult[];
export declare function parseDate(text: string, ref?: ParsingReference | Date, option?: ParsingOption): Date;
export declare function createCasualConfiguration(): Configuration;
export declare function createConfiguration(): Configuration;
