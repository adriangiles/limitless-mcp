"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../../types");
const AbstractParserWithWordBoundary_1 = require("../../../common/parsers/AbstractParserWithWordBoundary");
const dayjs_1 = require("../../../utils/dayjs");
const dayjs_2 = __importDefault(require("dayjs"));
class ESCasualTimeParser extends AbstractParserWithWordBoundary_1.AbstractParserWithWordBoundaryChecking {
    innerPattern() {
        return /(?:esta\s*)?(mañana|tarde|medianoche|mediodia|mediodía|noche)(?=\W|$)/i;
    }
    innerExtract(context, match) {
        const targetDate = (0, dayjs_2.default)(context.refDate);
        const component = context.createParsingComponents();
        switch (match[1].toLowerCase()) {
            case "tarde":
                component.imply("meridiem", types_1.Meridiem.PM);
                component.imply("hour", 15);
                break;
            case "noche":
                component.imply("meridiem", types_1.Meridiem.PM);
                component.imply("hour", 22);
                break;
            case "mañana":
                component.imply("meridiem", types_1.Meridiem.AM);
                component.imply("hour", 6);
                break;
            case "medianoche":
                (0, dayjs_1.assignTheNextDay)(component, targetDate);
                component.imply("hour", 0);
                component.imply("minute", 0);
                component.imply("second", 0);
                break;
            case "mediodia":
            case "mediodía":
                component.imply("meridiem", types_1.Meridiem.AM);
                component.imply("hour", 12);
                break;
        }
        return component;
    }
}
exports.default = ESCasualTimeParser;
//# sourceMappingURL=ESCasualTimeParser.js.map