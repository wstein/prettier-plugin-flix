// #201: own-line comment before `=` and after `= match` must stay idempotent
// across every integer print width from 20 to 160 (two format passes).
import assert from "node:assert/strict";
import test from "node:test";
import { fmt } from "./lib.mjs";

const OWN_LINE_BEFORE_EQUALS = `def wait(c: Chan, d: Deadline): Unit \\ { Chan, NonDet }
// own
= 1
`;

const OWN_LINE_AFTER_MATCH = `def wait(c: Chan, d: Deadline): Unit \\ { Chan, NonDet } = match
// own
c {
    case _ => ()
}
`;

const CASES = [
    ["own-line comment before `=`", OWN_LINE_BEFORE_EQUALS],
    ["own-line comment after `= match`", OWN_LINE_AFTER_MATCH],
];

for (const [label, source] of CASES) {
    test(`#201 ${label} is idempotent at print widths 20..160`, async () => {
        const failures = [];
        for (let printWidth = 20; printWidth <= 160; printWidth++) {
            const first = await fmt(source, { printWidth });
            const second = await fmt(first, { printWidth });
            if (first !== second) failures.push(printWidth);
        }
        assert.deepEqual(failures, [], `not idempotent at width(s): ${failures.join(", ")}`);
    });
}
