import { ParsingContext } from "../../../chrono";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary";
export default class NLCasualTimeParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(): RegExp;
    innerExtract(context: ParsingContext, match: RegExpMatchArray): import("..").ParsingComponents;
}
