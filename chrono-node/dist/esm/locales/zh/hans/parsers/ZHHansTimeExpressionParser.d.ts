import { ParsingContext } from "../../../../chrono.js";
import { AbstractParserWithWordBoundaryChecking } from "../../../../common/parsers/AbstractParserWithWordBoundary.js";
export default class ZHHansTimeExpressionParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(): RegExp;
    innerExtract(context: ParsingContext, match: RegExpMatchArray): import("../index.js").ParsingResult;
}
