"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const AbstractParserWithWordBoundary_1 = require("../../../../common/parsers/AbstractParserWithWordBoundary");
const constants_1 = require("../constants");
const PATTERN = new RegExp("(?:星期|禮拜|週)(?<weekday>" + Object.keys(constants_1.WEEKDAY_OFFSET).join("|") + ")");
class ZHHantWeekdayParser extends AbstractParserWithWordBoundary_1.AbstractParserWithWordBoundaryChecking {
    innerPattern() {
        return PATTERN;
    }
    innerExtract(context, match) {
        const result = context.createParsingResult(match.index, match[0]);
        const dayOfWeek = match.groups.weekday;
        const offset = constants_1.WEEKDAY_OFFSET[dayOfWeek];
        if (offset === undefined)
            return null;
        let startMoment = (0, dayjs_1.default)(context.refDate);
        const startMomentFixed = false;
        const refOffset = startMoment.day();
        if (Math.abs(offset - 7 - refOffset) < Math.abs(offset - refOffset)) {
            startMoment = startMoment.day(offset - 7);
        }
        else if (Math.abs(offset + 7 - refOffset) < Math.abs(offset - refOffset)) {
            startMoment = startMoment.day(offset + 7);
        }
        else {
            startMoment = startMoment.day(offset);
        }
        result.start.assign("weekday", offset);
        if (startMomentFixed) {
            result.start.assign("day", startMoment.date());
            result.start.assign("month", startMoment.month() + 1);
            result.start.assign("year", startMoment.year());
        }
        else {
            result.start.imply("day", startMoment.date());
            result.start.imply("month", startMoment.month() + 1);
            result.start.imply("year", startMoment.year());
        }
        return result;
    }
}
exports.default = ZHHantWeekdayParser;
//# sourceMappingURL=ZHHantWeekdayParser.js.map