"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const years_1 = require("../../../calculation/years");
const constants_1 = require("../constants");
const constants_2 = require("../constants");
const constants_3 = require("../constants");
const pattern_1 = require("../../../utils/pattern");
const AbstractParserWithWordBoundary_1 = require("../../../common/parsers/AbstractParserWithWordBoundary");
const PATTERN = new RegExp(`(?:on\\s{0,3})?` +
    `(${constants_3.ORDINAL_NUMBER_PATTERN})` +
    `(?:` +
    `\\s{0,3}(?:al|\\-|\\–|fino|alle|allo)?\\s{0,3}` +
    `(${constants_3.ORDINAL_NUMBER_PATTERN})` +
    ")?" +
    `(?:-|/|\\s{0,3}(?:dal)?\\s{0,3})` +
    `(${(0, pattern_1.matchAnyPattern)(constants_1.MONTH_DICTIONARY)})` +
    "(?:" +
    `(?:-|/|,?\\s{0,3})` +
    `(${constants_2.YEAR_PATTERN}(?![^\\s]\\d))` +
    ")?" +
    "(?=\\W|$)", "i");
const DATE_GROUP = 1;
const DATE_TO_GROUP = 2;
const MONTH_NAME_GROUP = 3;
const YEAR_GROUP = 4;
class ENMonthNameLittleEndianParser extends AbstractParserWithWordBoundary_1.AbstractParserWithWordBoundaryChecking {
    innerPattern() {
        return PATTERN;
    }
    innerExtract(context, match) {
        const result = context.createParsingResult(match.index, match[0]);
        const month = constants_1.MONTH_DICTIONARY[match[MONTH_NAME_GROUP].toLowerCase()];
        const day = (0, constants_3.parseOrdinalNumberPattern)(match[DATE_GROUP]);
        if (day > 31) {
            match.index = match.index + match[DATE_GROUP].length;
            return null;
        }
        result.start.assign("month", month);
        result.start.assign("day", day);
        if (match[YEAR_GROUP]) {
            const yearNumber = (0, constants_2.parseYear)(match[YEAR_GROUP]);
            result.start.assign("year", yearNumber);
        }
        else {
            const year = (0, years_1.findYearClosestToRef)(context.refDate, day, month);
            result.start.imply("year", year);
        }
        if (match[DATE_TO_GROUP]) {
            const endDate = (0, constants_3.parseOrdinalNumberPattern)(match[DATE_TO_GROUP]);
            result.end = result.start.clone();
            result.end.assign("day", endDate);
        }
        return result;
    }
}
exports.default = ENMonthNameLittleEndianParser;
//# sourceMappingURL=ITMonthNameLittleEndianParser.js.map