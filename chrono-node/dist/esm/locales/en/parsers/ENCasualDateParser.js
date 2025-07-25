import dayjs from "dayjs";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary.js";
import { assignSimilarDate } from "../../../utils/dayjs.js";
import * as references from "../../../common/casualReferences.js";
const PATTERN = /(now|today|tonight|tomorrow|overmorrow|tmr|tmrw|yesterday|last\s*night)(?=\W|$)/i;
export default class ENCasualDateParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(context) {
        return PATTERN;
    }
    innerExtract(context, match) {
        let targetDate = dayjs(context.refDate);
        const lowerText = match[0].toLowerCase();
        let component = context.createParsingComponents();
        switch (lowerText) {
            case "now":
                component = references.now(context.reference);
                break;
            case "today":
                component = references.today(context.reference);
                break;
            case "yesterday":
                component = references.yesterday(context.reference);
                break;
            case "tomorrow":
            case "tmr":
            case "tmrw":
                component = references.tomorrow(context.reference);
                break;
            case "tonight":
                component = references.tonight(context.reference);
                break;
            case "overmorrow":
                component = references.theDayAfter(context.reference, 2);
                break;
            default:
                if (lowerText.match(/last\s*night/)) {
                    if (targetDate.hour() > 6) {
                        targetDate = targetDate.add(-1, "day");
                    }
                    assignSimilarDate(component, targetDate);
                    component.imply("hour", 0);
                }
                break;
        }
        component.addTag("parser/ENCasualDateParser");
        return component;
    }
}
//# sourceMappingURL=ENCasualDateParser.js.map