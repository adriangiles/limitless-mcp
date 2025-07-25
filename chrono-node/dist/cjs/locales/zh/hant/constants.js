"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEEKDAY_OFFSET = exports.NUMBER = void 0;
exports.zhStringToNumber = zhStringToNumber;
exports.zhStringToYear = zhStringToYear;
exports.NUMBER = {
    "零": 0,
    "一": 1,
    "二": 2,
    "兩": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
    "十": 10,
    "廿": 20,
    "卅": 30,
};
exports.WEEKDAY_OFFSET = {
    "天": 0,
    "日": 0,
    "一": 1,
    "二": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
};
function zhStringToNumber(text) {
    let number = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === "十") {
            number = number === 0 ? exports.NUMBER[char] : number * exports.NUMBER[char];
        }
        else {
            number += exports.NUMBER[char];
        }
    }
    return number;
}
function zhStringToYear(text) {
    let string = "";
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        string = string + exports.NUMBER[char];
    }
    return parseInt(string);
}
//# sourceMappingURL=constants.js.map