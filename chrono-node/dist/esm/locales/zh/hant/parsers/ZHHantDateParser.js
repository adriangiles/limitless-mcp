import dayjs from "dayjs";
import { AbstractParserWithWordBoundaryChecking } from "../../../../common/parsers/AbstractParserWithWordBoundary.js";
import { NUMBER, zhStringToNumber, zhStringToYear } from "../constants.js";
const YEAR_GROUP = 1;
const MONTH_GROUP = 2;
const DAY_GROUP = 3;
export default class ZHHantDateParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern() {
        return new RegExp("(" +
            "\\d{2,4}|" +
            "[" + Object.keys(NUMBER).join("") + "]{4}|" +
            "[" + Object.keys(NUMBER).join("") + "]{2}" +
            ")?" +
            "(?:\\s*)" +
            "(?:年)?" +
            "(?:[\\s|,|，]*)" +
            "(" +
            "\\d{1,2}|" +
            "[" + Object.keys(NUMBER).join("") + "]{1,2}" +
            ")" +
            "(?:\\s*)" +
            "(?:月)" +
            "(?:\\s*)" +
            "(" +
            "\\d{1,2}|" +
            "[" + Object.keys(NUMBER).join("") + "]{1,2}" +
            ")?" +
            "(?:\\s*)" +
            "(?:日|號)?");
    }
    innerExtract(context, match) {
        const startMoment = dayjs(context.refDate);
        const result = context.createParsingResult(match.index, match[0]);
        let month = parseInt(match[MONTH_GROUP]);
        if (isNaN(month))
            month = zhStringToNumber(match[MONTH_GROUP]);
        result.start.assign("month", month);
        if (match[DAY_GROUP]) {
            let day = parseInt(match[DAY_GROUP]);
            if (isNaN(day))
                day = zhStringToNumber(match[DAY_GROUP]);
            result.start.assign("day", day);
        }
        else {
            result.start.imply("day", startMoment.date());
        }
        if (match[YEAR_GROUP]) {
            let year = parseInt(match[YEAR_GROUP]);
            if (isNaN(year))
                year = zhStringToYear(match[YEAR_GROUP]);
            result.start.assign("year", year);
        }
        else {
            result.start.imply("year", startMoment.year());
        }
        return result;
    }
}
//# sourceMappingURL=ZHHantDateParser.js.map