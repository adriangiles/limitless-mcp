"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const results_1 = require("../../../results");
const AbstractParserWithWordBoundary_1 = require("../../../common/parsers/AbstractParserWithWordBoundary");
const timeunits_1 = require("../../../utils/timeunits");
const PATTERN = new RegExp(`(${constants_1.TIME_UNITS_PATTERN})\\s{0,5}(?:fa|prima|precedente)(?=(?:\\W|$))`, "i");
const STRICT_PATTERN = new RegExp(`(${constants_1.TIME_UNITS_PATTERN})\\s{0,5}fa(?=(?:\\W|$))`, "i");
class ENTimeUnitAgoFormatParser extends AbstractParserWithWordBoundary_1.AbstractParserWithWordBoundaryChecking {
    constructor(strictMode) {
        super();
        this.strictMode = strictMode;
    }
    innerPattern() {
        return this.strictMode ? STRICT_PATTERN : PATTERN;
    }
    innerExtract(context, match) {
        const timeUnits = (0, constants_1.parseTimeUnits)(match[1]);
        const outputTimeUnits = (0, timeunits_1.reverseTimeUnits)(timeUnits);
        return results_1.ParsingComponents.createRelativeFromReference(context.reference, outputTimeUnits);
    }
}
exports.default = ENTimeUnitAgoFormatParser;
//# sourceMappingURL=ITTimeUnitAgoFormatParser.js.map