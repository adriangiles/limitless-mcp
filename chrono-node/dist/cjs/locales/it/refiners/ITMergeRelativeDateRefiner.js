"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstractRefiners_1 = require("../../../common/abstractRefiners");
const results_1 = require("../../../results");
const constants_1 = require("../constants");
const timeunits_1 = require("../../../utils/timeunits");
function hasImpliedEarlierReferenceDate(result) {
    return result.text.match(/\s+(prima|dal)$/i) != null;
}
function hasImpliedLaterReferenceDate(result) {
    return result.text.match(/\s+(dopo|dal|fino)$/i) != null;
}
class ENMergeRelativeDateRefiner extends abstractRefiners_1.MergingRefiner {
    patternBetween() {
        return /^\s*$/i;
    }
    shouldMergeResults(textBetween, currentResult, nextResult) {
        if (!textBetween.match(this.patternBetween())) {
            return false;
        }
        if (!hasImpliedEarlierReferenceDate(currentResult) && !hasImpliedLaterReferenceDate(currentResult)) {
            return false;
        }
        return !!nextResult.start.get("day") && !!nextResult.start.get("month") && !!nextResult.start.get("year");
    }
    mergeResults(textBetween, currentResult, nextResult) {
        let timeUnits = (0, constants_1.parseTimeUnits)(currentResult.text);
        if (hasImpliedEarlierReferenceDate(currentResult)) {
            timeUnits = (0, timeunits_1.reverseTimeUnits)(timeUnits);
        }
        const components = results_1.ParsingComponents.createRelativeFromReference(new results_1.ReferenceWithTimezone(nextResult.start.date()), timeUnits);
        return new results_1.ParsingResult(nextResult.reference, currentResult.index, `${currentResult.text}${textBetween}${nextResult.text}`, components);
    }
}
exports.default = ENMergeRelativeDateRefiner;
//# sourceMappingURL=ITMergeRelativeDateRefiner.js.map