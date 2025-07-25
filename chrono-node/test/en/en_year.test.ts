import * as chrono from "../../src";
import { testSingleCase, testUnexpectedResult } from "../test_util";
import { Meridiem } from "../../src";

test("Test - Year numbers with BCE/CE Era label", () => {
    testSingleCase(chrono, "10 August 234 BCE", new Date(2012, 7, 10), (result) => {
        expect(result.index).toBe(0);
        expect(result.text).toBe("10 August 234 BCE"); // fails since text is `10 August 234`

        expect(result.start).not.toBeNull();
        expect(result.start.get("year")).toBe(-234);
        expect(result.start.get("month")).toBe(8);
        expect(result.start.get("day")).toBe(10);

        expect(result.start).toBeDate(new Date(-234, 8 - 1, 10, 12));
    });

    testSingleCase(chrono, "10 August 88 CE", new Date(2012, 7, 10), (result) => {
        expect(result.index).toBe(0);
        expect(result.text).toBe("10 August 88 CE");

        expect(result.start).not.toBeNull();
        expect(result.start.get("year")).toBe(88);
        expect(result.start.get("month")).toBe(8);
        expect(result.start.get("day")).toBe(10);

        const resultDate = result.start.date();
        const expectDate = new Date(88, 8 - 1, 10, 12);
        expectDate.setFullYear(88);
        expect(expectDate.getTime()).toBeCloseTo(resultDate.getTime());
    });
});

test("Test - Year numbers with BC/AD Era label", () => {
    testSingleCase(chrono, "10 August 234 BC", new Date(2012, 7, 10), (result) => {
        expect(result.index).toBe(0);
        expect(result.text).toBe("10 August 234 BC");

        expect(result.start).not.toBeNull();
        expect(result.start.get("year")).toBe(-234);
        expect(result.start.get("month")).toBe(8);
        expect(result.start.get("day")).toBe(10);

        expect(result.start).toBeDate(new Date(-234, 8 - 1, 10, 12));
    });

    testSingleCase(chrono, "10 August 88 AD", new Date(2012, 7, 10), (result) => {
        expect(result.index).toBe(0);
        expect(result.text).toBe("10 August 88 AD");

        expect(result.start).not.toBeNull();
        expect(result.start.get("year")).toBe(88);
        expect(result.start.get("month")).toBe(8);
        expect(result.start.get("day")).toBe(10);

        const resultDate = result.start.date();
        const expectDate = new Date(88, 8 - 1, 10, 12);
        expectDate.setFullYear(88);
        expect(expectDate.getTime()).toBeCloseTo(resultDate.getTime());
    });
});

test("Test - Year numbers with Buddhist Era label", () => {
    testSingleCase(chrono, "10 August 2555 BE", new Date(2012, 7, 10), (result) => {
        expect(result.index).toBe(0);
        expect(result.text).toBe("10 August 2555 BE");

        expect(result.start).not.toBeNull();
        expect(result.start.get("year")).toBe(2012);
        expect(result.start.get("month")).toBe(8);
        expect(result.start.get("day")).toBe(10);

        expect(result.start).toBeDate(new Date(2012, 8 - 1, 10, 12));
    });
});

test("Test - Year number after date/time expression", () => {
    testSingleCase(chrono, "Thu Oct 26 11:00:09 2023", new Date(2016, 10 - 1, 1, 8), (result, text) => {
        expect(result.start.get("year")).toBe(2023);
        expect(result.start.get("month")).toBe(10);
        expect(result.start.get("day")).toBe(26);

        expect(result.start.get("hour")).toBe(11);
        expect(result.start.get("minute")).toBe(0);
        expect(result.start.get("second")).toBe(9);
        expect(result.start.get("meridiem")).toBe(Meridiem.AM);
    });

    testSingleCase(chrono, "Thu Oct 26 11:00:09 EDT 2023", new Date(2016, 10 - 1, 1, 8), (result, text) => {
        expect(result.start.get("year")).toBe(2023);
        expect(result.start.get("month")).toBe(10);
        expect(result.start.get("day")).toBe(26);

        expect(result.start.get("hour")).toBe(11);
        expect(result.start.get("minute")).toBe(0);
        expect(result.start.get("second")).toBe(9);
        expect(result.start.get("meridiem")).toBe(Meridiem.AM);
        expect(result.start.get("timezoneOffset")).toBe(-240);
    });
});

test("Test - Year number after date/time range expression", () => {
    testSingleCase(chrono, "Thu Oct 26 - 28, 11:00:09 2023", new Date(2016, 10 - 1, 1, 8), (result, text) => {
        expect(result.start.get("year")).toBe(2023);
        expect(result.start.get("month")).toBe(10);
        expect(result.start.get("day")).toBe(26);
        expect(result.start.get("hour")).toBe(11);
        expect(result.start.get("minute")).toBe(0);
        expect(result.start.get("second")).toBe(9);
        expect(result.start.get("meridiem")).toBe(Meridiem.AM);

        expect(result.end.get("year")).toBe(2023);
        expect(result.end.get("month")).toBe(10);
        expect(result.end.get("day")).toBe(28);
        expect(result.end.get("hour")).toBe(11);
        expect(result.end.get("minute")).toBe(0);
        expect(result.end.get("second")).toBe(9);
        expect(result.end.get("meridiem")).toBe(Meridiem.AM);
    });

    testSingleCase(chrono, "Thu Oct 26, 10:00 - 11:00:09 2023", new Date(2016, 10 - 1, 1, 8), (result, text) => {
        expect(result.start.get("year")).toBe(2023);
        expect(result.start.get("month")).toBe(10);
        expect(result.start.get("day")).toBe(26);
        expect(result.start.get("hour")).toBe(10);
        expect(result.start.get("minute")).toBe(0);
        expect(result.start.get("second")).toBe(0);
        expect(result.start.get("meridiem")).toBe(Meridiem.AM);

        expect(result.end.get("year")).toBe(2023);
        expect(result.end.get("month")).toBe(10);
        expect(result.end.get("day")).toBe(26);
        expect(result.end.get("hour")).toBe(11);
        expect(result.end.get("minute")).toBe(0);
        expect(result.end.get("second")).toBe(9);
        expect(result.end.get("meridiem")).toBe(Meridiem.AM);
    });
});
