"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIME_UNITS_PATTERN = exports.YEAR_PATTERN = exports.ORDINAL_NUMBER_PATTERN = exports.NUMBER_PATTERN = exports.TIME_UNIT_DICTIONARY = exports.ORDINAL_WORD_DICTIONARY = exports.INTEGER_WORD_DICTIONARY = exports.MONTH_DICTIONARY = exports.FULL_MONTH_NAME_DICTIONARY = exports.WEEKDAY_DICTIONARY = exports.REGEX_PARTS = void 0;
exports.parseNumberPattern = parseNumberPattern;
exports.parseOrdinalNumberPattern = parseOrdinalNumberPattern;
exports.parseYearPattern = parseYearPattern;
exports.parseTimeUnits = parseTimeUnits;
const pattern_1 = require("../../utils/pattern");
const years_1 = require("../../calculation/years");
exports.REGEX_PARTS = {
    leftBoundary: "([^\\p{L}\\p{N}_]|^)",
    rightBoundary: "(?=[^\\p{L}\\p{N}_]|$)",
    flags: "iu",
};
exports.WEEKDAY_DICTIONARY = {
    "неділя": 0,
    "неділі": 0,
    "неділю": 0,
    "нд": 0,
    "нд.": 0,
    "понеділок": 1,
    "понеділка": 1,
    "пн": 1,
    "пн.": 1,
    "вівторок": 2,
    "вівторка": 2,
    "вт": 2,
    "вт.": 2,
    "середа": 3,
    "середи": 3,
    "середу": 3,
    "ср": 3,
    "ср.": 3,
    "четвер": 4,
    "четверга": 4,
    "четвергу": 4,
    "чт": 4,
    "чт.": 4,
    "п'ятниця": 5,
    "п'ятниці": 5,
    "п'ятницю": 5,
    "пт": 5,
    "пт.": 5,
    "субота": 6,
    "суботи": 6,
    "суботу": 6,
    "сб": 6,
    "сб.": 6,
};
exports.FULL_MONTH_NAME_DICTIONARY = {
    "січень": 1,
    "січня": 1,
    "січні": 1,
    "лютий": 2,
    "лютого": 2,
    "лютому": 2,
    "березень": 3,
    "березня": 3,
    "березні": 3,
    "квітень": 4,
    "квітня": 4,
    "квітні": 4,
    "травень": 5,
    "травня": 5,
    "травні": 5,
    "червень": 6,
    "червня": 6,
    "червні": 6,
    "липень": 7,
    "липня": 7,
    "липні": 7,
    "серпень": 8,
    "серпня": 8,
    "серпні": 8,
    "вересень": 9,
    "вересня": 9,
    "вересні": 9,
    "жовтень": 10,
    "жовтня": 10,
    "жовтні": 10,
    "листопад": 11,
    "листопада": 11,
    "листопаду": 11,
    "грудень": 12,
    "грудня": 12,
    "грудні": 12,
};
exports.MONTH_DICTIONARY = Object.assign(Object.assign({}, exports.FULL_MONTH_NAME_DICTIONARY), { "січ": 1, "січ.": 1, "лют": 2, "лют.": 2, "бер": 3, "бер.": 3, "квіт": 4, "квіт.": 4, "трав": 5, "трав.": 5, "черв": 6, "черв.": 6, "лип": 7, "лип.": 7, "серп": 8, "серп.": 8, "сер": 8, "cер.": 8, "вер": 9, "вер.": 9, "верес": 9, "верес.": 9, "жовт": 10, "жовт.": 10, "листоп": 11, "листоп.": 11, "груд": 12, "груд.": 12 });
exports.INTEGER_WORD_DICTIONARY = {
    "один": 1,
    "одна": 1,
    "одної": 1,
    "одну": 1,
    "дві": 2,
    "два": 2,
    "двох": 2,
    "три": 3,
    "трьох": 3,
    "чотири": 4,
    "чотирьох": 4,
    "п'ять": 5,
    "п'яти": 5,
    "шість": 6,
    "шести": 6,
    "сім": 7,
    "семи": 7,
    "вісім": 8,
    "восьми": 8,
    "дев'ять": 9,
    "дев'яти": 9,
    "десять": 10,
    "десяти": 10,
    "одинадцять": 11,
    "одинадцяти": 11,
    "дванадцять": 12,
    "дванадцяти": 12,
};
exports.ORDINAL_WORD_DICTIONARY = {
    "перше": 1,
    "першого": 1,
    "друге": 2,
    "другого": 2,
    "третє": 3,
    "третього": 3,
    "четверте": 4,
    "четвертого": 4,
    "п'яте": 5,
    "п'ятого": 5,
    "шосте": 6,
    "шостого": 6,
    "сьоме": 7,
    "сьомого": 7,
    "восьме": 8,
    "восьмого": 8,
    "дев'яте": 9,
    "дев'ятого": 9,
    "десяте": 10,
    "десятого": 10,
    "одинадцяте": 11,
    "одинадцятого": 11,
    "дванадцяте": 12,
    "дванадцятого": 12,
    "тринадцяте": 13,
    "тринадцятого": 13,
    "чотирнадцяте": 14,
    "чотинрнадцятого": 14,
    "п'ятнадцяте": 15,
    "п'ятнадцятого": 15,
    "шістнадцяте": 16,
    "шістнадцятого": 16,
    "сімнадцяте": 17,
    "сімнадцятого": 17,
    "вісімнадцяте": 18,
    "вісімнадцятого": 18,
    "дев'ятнадцяте": 19,
    "дев'ятнадцятого": 19,
    "двадцяте": 20,
    "двадцятого": 20,
    "двадцять перше": 21,
    "двадцять першого": 21,
    "двадцять друге": 22,
    "двадцять другого": 22,
    "двадцять третє": 23,
    "двадцять третього": 23,
    "двадцять четверте": 24,
    "двадцять четвертого": 24,
    "двадцять п'яте": 25,
    "двадцять п'ятого": 25,
    "двадцять шосте": 26,
    "двадцять шостого": 26,
    "двадцять сьоме": 27,
    "двадцять сьомого": 27,
    "двадцять восьме": 28,
    "двадцять восьмого": 28,
    "двадцять дев'яте": 29,
    "двадцять дев'ятого": 29,
    "тридцяте": 30,
    "тридцятого": 30,
    "тридцять перше": 31,
    "тридцять першого": 31,
};
exports.TIME_UNIT_DICTIONARY = {
    сек: "second",
    секунда: "second",
    секунд: "second",
    секунди: "second",
    секунду: "second",
    секундочок: "second",
    секундочки: "second",
    секундочку: "second",
    хв: "minute",
    хвилина: "minute",
    хвилин: "minute",
    хвилини: "minute",
    хвилину: "minute",
    хвилинок: "minute",
    хвилинки: "minute",
    хвилинку: "minute",
    хвилиночок: "minute",
    хвилиночки: "minute",
    хвилиночку: "minute",
    год: "hour",
    година: "hour",
    годин: "hour",
    години: "hour",
    годину: "hour",
    годинка: "hour",
    годинок: "hour",
    годинки: "hour",
    годинку: "hour",
    день: "d",
    дня: "d",
    днів: "d",
    дні: "d",
    доба: "d",
    добу: "d",
    тиждень: "week",
    тижню: "week",
    тижня: "week",
    тижні: "week",
    тижнів: "week",
    місяць: "month",
    місяців: "month",
    місяці: "month",
    місяця: "month",
    квартал: "quarter",
    кварталу: "quarter",
    квартала: "quarter",
    кварталів: "quarter",
    кварталі: "quarter",
    рік: "year",
    року: "year",
    році: "year",
    років: "year",
    роки: "year",
};
exports.NUMBER_PATTERN = `(?:${(0, pattern_1.matchAnyPattern)(exports.INTEGER_WORD_DICTIONARY)}|[0-9]+|[0-9]+\\.[0-9]+|пів|декілька|пар(?:у)|\\s{0,3})`;
function parseNumberPattern(match) {
    const num = match.toLowerCase();
    if (exports.INTEGER_WORD_DICTIONARY[num] !== undefined) {
        return exports.INTEGER_WORD_DICTIONARY[num];
    }
    if (num.match(/декілька/)) {
        return 2;
    }
    else if (num.match(/пів/)) {
        return 0.5;
    }
    else if (num.match(/пар/)) {
        return 2;
    }
    else if (num === "") {
        return 1;
    }
    return parseFloat(num);
}
exports.ORDINAL_NUMBER_PATTERN = `(?:${(0, pattern_1.matchAnyPattern)(exports.ORDINAL_WORD_DICTIONARY)}|[0-9]{1,2}(?:го|ого|е)?)`;
function parseOrdinalNumberPattern(match) {
    const num = match.toLowerCase();
    if (exports.ORDINAL_WORD_DICTIONARY[num] !== undefined) {
        return exports.ORDINAL_WORD_DICTIONARY[num];
    }
    return parseInt(num);
}
const year = "(?:\\s+(?:року|рік|р|р.))?";
exports.YEAR_PATTERN = `(?:[1-9][0-9]{0,3}${year}\\s*(?:н.е.|до н.е.|н. е.|до н. е.)|[1-2][0-9]{3}${year}|[5-9][0-9]${year})`;
function parseYearPattern(match) {
    if (/(рік|року|р|р.)/i.test(match)) {
        match = match.replace(/(рік|року|р|р.)/i, "");
    }
    if (/(до н.е.|до н. е.)/i.test(match)) {
        match = match.replace(/(до н.е.|до н. е.)/i, "");
        return -parseInt(match);
    }
    if (/(н. е.|н.е.)/i.test(match)) {
        match = match.replace(/(н. е.|н.е.)/i, "");
        return parseInt(match);
    }
    const rawYearNumber = parseInt(match);
    return (0, years_1.findMostLikelyADYear)(rawYearNumber);
}
const SINGLE_TIME_UNIT_PATTERN = `(${exports.NUMBER_PATTERN})\\s{0,3}(${(0, pattern_1.matchAnyPattern)(exports.TIME_UNIT_DICTIONARY)})`;
const SINGLE_TIME_UNIT_REGEX = new RegExp(SINGLE_TIME_UNIT_PATTERN, "i");
exports.TIME_UNITS_PATTERN = (0, pattern_1.repeatedTimeunitPattern)(`(?:(?:близько|приблизно)\\s{0,3})?`, SINGLE_TIME_UNIT_PATTERN);
function parseTimeUnits(timeunitText) {
    const fragments = {};
    let remainingText = timeunitText;
    let match = SINGLE_TIME_UNIT_REGEX.exec(remainingText);
    while (match) {
        collectDateTimeFragment(fragments, match);
        remainingText = remainingText.substring(match[0].length).trim();
        match = SINGLE_TIME_UNIT_REGEX.exec(remainingText);
    }
    return fragments;
}
function collectDateTimeFragment(fragments, match) {
    const num = parseNumberPattern(match[1]);
    const unit = exports.TIME_UNIT_DICTIONARY[match[2].toLowerCase()];
    fragments[unit] = num;
}
//# sourceMappingURL=constants.js.map