"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../../index");
const AbstractParserWithWordBoundary_1 = require("../../../common/parsers/AbstractParserWithWordBoundary");
const dayjs_1 = __importDefault(require("dayjs"));
const dayjs_2 = require("../../../utils/dayjs");
const PATTERN = /(?:questo|questa)?\s{0,3}(mattina|pomeriggio|sera|notte|mezzanotte|mezzogiorno)(?=\W|$)/i;
class ENCasualTimeParser extends AbstractParserWithWordBoundary_1.AbstractParserWithWordBoundaryChecking {
    innerPattern() {
        return PATTERN;
    }
    innerExtract(context, match) {
        const targetDate = (0, dayjs_1.default)(context.refDate);
        const component = context.createParsingComponents();
        switch (match[1].toLowerCase()) {
            case "pomeriggio":
                component.imply("meridiem", index_1.Meridiem.PM);
                component.imply("hour", 15);
                break;
            case "sera":
            case "notte":
                component.imply("meridiem", index_1.Meridiem.PM);
                component.imply("hour", 20);
                break;
            case "mezzanotte":
                (0, dayjs_2.assignTheNextDay)(component, targetDate);
                component.imply("hour", 0);
                component.imply("minute", 0);
                component.imply("second", 0);
                break;
            case "mattina":
                component.imply("meridiem", index_1.Meridiem.AM);
                component.imply("hour", 6);
                break;
            case "mezzogiorno":
                component.imply("meridiem", index_1.Meridiem.AM);
                component.imply("hour", 12);
                break;
        }
        return component;
    }
}
exports.default = ENCasualTimeParser;
//# sourceMappingURL=ITCasualTimeParser.js.map