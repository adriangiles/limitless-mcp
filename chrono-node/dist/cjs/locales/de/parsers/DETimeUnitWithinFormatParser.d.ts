import { ParsingContext } from "../../../chrono";
import { ParsingComponents } from "../../../results";
import { AbstractParserWithWordBoundaryChecking } from "../../../common/parsers/AbstractParserWithWordBoundary";
export default class DETimeUnitWithinFormatParser extends AbstractParserWithWordBoundaryChecking {
    innerPattern(): RegExp;
    innerExtract(context: ParsingContext, match: RegExpMatchArray): ParsingComponents;
}
