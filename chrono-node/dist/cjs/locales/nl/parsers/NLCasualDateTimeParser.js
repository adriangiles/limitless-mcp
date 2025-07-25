"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractParserWithWordBoundary_1 = require("../../../common/parsers/AbstractParserWithWordBoundary");
const types_1 = require("../../../types");
const dayjs_1 = require("../../../utils/dayjs");
const dayjs_2 = __importDefault(require("dayjs"));
const DATE_GROUP = 1;
const TIME_OF_DAY_GROUP = 2;
class NLCasualDateTimeParser extends AbstractParserWithWordBoundary_1.AbstractParserWithWordBoundaryChecking {
    innerPattern(context) {
        return /(gisteren|morgen|van)(ochtend|middag|namiddag|avond|nacht)(?=\W|$)/i;
    }
    innerExtract(context, match) {
        const dateText = match[DATE_GROUP].toLowerCase();
        const timeText = match[TIME_OF_DAY_GROUP].toLowerCase();
        const component = context.createParsingComponents();
        const targetDate = (0, dayjs_2.default)(context.refDate);
        switch (dateText) {
            case "gisteren":
                (0, dayjs_1.assignSimilarDate)(component, targetDate.add(-1, "day"));
                break;
            case "van":
                (0, dayjs_1.assignSimilarDate)(component, targetDate);
                break;
            case "morgen":
                (0, dayjs_1.assignTheNextDay)(component, targetDate);
                break;
        }
        switch (timeText) {
            case "ochtend":
                component.imply("meridiem", types_1.Meridiem.AM);
                component.imply("hour", 6);
                break;
            case "middag":
                component.imply("meridiem", types_1.Meridiem.AM);
                component.imply("hour", 12);
                break;
            case "namiddag":
                component.imply("meridiem", types_1.Meridiem.PM);
                component.imply("hour", 15);
                break;
            case "avond":
                component.imply("meridiem", types_1.Meridiem.PM);
                component.imply("hour", 20);
                break;
        }
        return component;
    }
}
exports.default = NLCasualDateTimeParser;
//# sourceMappingURL=NLCasualDateTimeParser.js.map