"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const results_1 = require("../../../results");
const AbstractParserWithWordBoundary_1 = require("../../../common/parsers/AbstractParserWithWordBoundary");
const PATTERN = new RegExp(`(${constants_1.TIME_UNITS_PATTERN})\\s{0,5}(?:dopo|più tardi|da adesso|avanti|oltre|a seguire)` + "(?=(?:\\W|$))", "i");
const STRICT_PATTERN = new RegExp("" + "(" + constants_1.TIME_UNITS_PATTERN + ")" + "(dopo|più tardi)" + "(?=(?:\\W|$))", "i");
const GROUP_NUM_TIMEUNITS = 1;
class ENTimeUnitLaterFormatParser extends AbstractParserWithWordBoundary_1.AbstractParserWithWordBoundaryChecking {
    constructor(strictMode) {
        super();
        this.strictMode = strictMode;
    }
    innerPattern() {
        return this.strictMode ? STRICT_PATTERN : PATTERN;
    }
    innerExtract(context, match) {
        const fragments = (0, constants_1.parseTimeUnits)(match[GROUP_NUM_TIMEUNITS]);
        return results_1.ParsingComponents.createRelativeFromReference(context.reference, fragments);
    }
}
exports.default = ENTimeUnitLaterFormatParser;
//# sourceMappingURL=ITTimeUnitLaterFormatParser.js.map