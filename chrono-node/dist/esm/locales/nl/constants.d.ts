import { OpUnitType } from "dayjs";
import { TimeUnits } from "../../utils/timeunits.js";
export declare const WEEKDAY_DICTIONARY: {
    [word: string]: number;
};
export declare const MONTH_DICTIONARY: {
    [word: string]: number;
};
export declare const INTEGER_WORD_DICTIONARY: {
    [word: string]: number;
};
export declare const ORDINAL_WORD_DICTIONARY: {
    [word: string]: number;
};
export declare const TIME_UNIT_DICTIONARY: {
    [word: string]: OpUnitType;
};
export declare const NUMBER_PATTERN: string;
export declare function parseNumberPattern(match: string): number;
export declare const ORDINAL_NUMBER_PATTERN: string;
export declare function parseOrdinalNumberPattern(match: string): number;
export declare const YEAR_PATTERN = "(?:[1-9][0-9]{0,3}\\s*(?:voor Christus|na Christus)|[1-2][0-9]{3}|[5-9][0-9])";
export declare function parseYear(match: string): number;
export declare const TIME_UNITS_PATTERN: string;
export declare function parseTimeUnits(timeunitText: any): TimeUnits;
