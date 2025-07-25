import { Parser, ParsingContext } from "../../../chrono.js";
import { ParsingResult } from "../../../results.js";
export default class DESpecificTimeExpressionParser implements Parser {
    pattern(context: any): RegExp;
    extract(context: ParsingContext, match: RegExpMatchArray): ParsingResult | null;
    private static extractTimeComponent;
}
