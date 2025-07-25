import { ParsingContext } from "../../../chrono";
import { ParsingComponents } from "../../../results";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary";
export default class ITRelativeDateFormatParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(): RegExp;
    innerExtract(context: ParsingContext, match: RegExpMatchArray): ParsingComponents;
}
