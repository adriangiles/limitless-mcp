"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../../types");
const AbstractTimeExpressionParser_1 = require("../../../common/parsers/AbstractTimeExpressionParser");
const constants_1 = require("../constants");
class RUTimeExpressionParser extends AbstractTimeExpressionParser_1.AbstractTimeExpressionParser {
    constructor(strictMode) {
        super(strictMode);
    }
    patternFlags() {
        return constants_1.REGEX_PARTS.flags;
    }
    primaryPatternLeftBoundary() {
        return `(^|\\s|T|(?:[^\\p{L}\\p{N}_]))`;
    }
    followingPhase() {
        return `\\s*(?:\\-|\\–|\\~|\\〜|до|и|по|\\?)\\s*`;
    }
    primaryPrefix() {
        return `(?:(?:в|с)\\s*)??`;
    }
    primarySuffix() {
        return `(?:\\s*(?:утра|вечера|после полудня))?(?!\\/)${constants_1.REGEX_PARTS.rightBoundary}`;
    }
    extractPrimaryTimeComponents(context, match) {
        const components = super.extractPrimaryTimeComponents(context, match);
        if (components) {
            if (match[0].endsWith("вечера")) {
                const hour = components.get("hour");
                if (hour >= 6 && hour < 12) {
                    components.assign("hour", components.get("hour") + 12);
                    components.assign("meridiem", types_1.Meridiem.PM);
                }
                else if (hour < 6) {
                    components.assign("meridiem", types_1.Meridiem.AM);
                }
            }
            if (match[0].endsWith("после полудня")) {
                components.assign("meridiem", types_1.Meridiem.PM);
                const hour = components.get("hour");
                if (hour >= 0 && hour <= 6) {
                    components.assign("hour", components.get("hour") + 12);
                }
            }
            if (match[0].endsWith("утра")) {
                components.assign("meridiem", types_1.Meridiem.AM);
                const hour = components.get("hour");
                if (hour < 12) {
                    components.assign("hour", components.get("hour"));
                }
            }
        }
        return components;
    }
}
exports.default = RUTimeExpressionParser;
//# sourceMappingURL=RUTimeExpressionParser.js.map