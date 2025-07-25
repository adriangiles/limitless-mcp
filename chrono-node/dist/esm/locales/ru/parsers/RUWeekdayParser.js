import { WEEKDAY_DICTIONARY } from "../constants.js";
import { matchAnyPattern } from "../../../utils/pattern.js";
import { createParsingComponentsAtWeekday } from "../../../calculation/weekdays.js";
import { AbstractParserWithLeftRightBoundaryChecking } from "./AbstractParserWithWordBoundaryChecking.js";
const PREFIX_GROUP = 1;
const WEEKDAY_GROUP = 2;
const POSTFIX_GROUP = 3;
export default class RUWeekdayParser extends AbstractParserWithLeftRightBoundaryChecking {
    innerPatternString(context) {
        return (`(?:(?:,|\\(|（)\\s*)?` +
            `(?:в\\s*?)?` +
            `(?:(эту|этот|прошлый|прошлую|следующий|следующую|следующего)\\s*)?` +
            `(${matchAnyPattern(WEEKDAY_DICTIONARY)})` +
            `(?:\\s*(?:,|\\)|）))?` +
            `(?:\\s*на\\s*(этой|прошлой|следующей)\\s*неделе)?`);
    }
    innerExtract(context, match) {
        const dayOfWeek = match[WEEKDAY_GROUP].toLowerCase();
        const weekday = WEEKDAY_DICTIONARY[dayOfWeek];
        const prefix = match[PREFIX_GROUP];
        const postfix = match[POSTFIX_GROUP];
        let modifierWord = prefix || postfix;
        modifierWord = modifierWord || "";
        modifierWord = modifierWord.toLowerCase();
        let modifier = null;
        if (modifierWord == "прошлый" || modifierWord == "прошлую" || modifierWord == "прошлой") {
            modifier = "last";
        }
        else if (modifierWord == "следующий" ||
            modifierWord == "следующую" ||
            modifierWord == "следующей" ||
            modifierWord == "следующего") {
            modifier = "next";
        }
        else if (modifierWord == "этот" || modifierWord == "эту" || modifierWord == "этой") {
            modifier = "this";
        }
        return createParsingComponentsAtWeekday(context.reference, weekday, modifier);
    }
}
//# sourceMappingURL=RUWeekdayParser.js.map