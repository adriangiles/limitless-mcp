import { ParsingContext } from "../../../chrono.js";
import { ParsingComponents, ParsingResult } from "../../../results.js";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary.js";
export default class NLCasualDateParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(context: ParsingContext): RegExp;
    innerExtract(context: ParsingContext, match: RegExpMatchArray): ParsingComponents | ParsingResult;
}
