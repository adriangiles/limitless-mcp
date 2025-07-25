"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const results_1 = require("../../../results");
const AbstractParserWithWordBoundary_1 = require("../../../common/parsers/AbstractParserWithWordBoundary");
const PATTERN_WITH_PREFIX = new RegExp(`(?:within|in|for)\\s*` +
    `(?:(?:più o meno|intorno|approssimativamente|verso|verso le)\\s*(?:~\\s*)?)?(${constants_1.TIME_UNITS_PATTERN})(?=\\W|$)`, "i");
const PATTERN_WITHOUT_PREFIX = new RegExp(`(?:(?:più o meno|intorno|approssimativamente|verso|verso le)\\s*(?:~\\s*)?)?(${constants_1.TIME_UNITS_PATTERN})(?=\\W|$)`, "i");
class ENTimeUnitWithinFormatParser extends AbstractParserWithWordBoundary_1.AbstractParserWithWordBoundaryChecking {
    innerPattern(context) {
        return context.option.forwardDate ? PATTERN_WITHOUT_PREFIX : PATTERN_WITH_PREFIX;
    }
    innerExtract(context, match) {
        const timeUnits = (0, constants_1.parseTimeUnits)(match[1]);
        return results_1.ParsingComponents.createRelativeFromReference(context.reference, timeUnits);
    }
}
exports.default = ENTimeUnitWithinFormatParser;
//# sourceMappingURL=ITTimeUnitWithinFormatParser.js.map