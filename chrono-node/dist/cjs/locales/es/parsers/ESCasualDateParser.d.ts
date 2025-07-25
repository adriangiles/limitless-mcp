import { ParsingContext } from "../../../chrono";
import { ParsingComponents, ParsingResult } from "../../../results";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary";
export default class ESCasualDateParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(context: ParsingContext): RegExp;
    innerExtract(context: ParsingContext, match: RegExpMatchArray): ParsingComponents | ParsingResult;
}
