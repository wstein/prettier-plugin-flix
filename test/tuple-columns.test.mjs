import assert from "node:assert/strict";
import test from "node:test";
import { alignTupleFields, columnWidths } from "../dist/TupleColumns.res.mjs";

/** Same shape TypeScript passes after measuring display widths. */
const decimalRows = [
    [
        { text: "8.0", before: 1, after: 2 },
        { text: "Central", before: 0, after: 7 },
    ],
    [
        { text: "45.6", before: 2, after: 2 },
        { text: "Airport", before: 0, after: 7 },
    ],
    [
        { text: "6.77", before: 1, after: 3 },
        { text: "Park", before: 0, after: 4 },
    ],
];

test("ReScript columnWidths takes before/after maxima per column", () => {
    assert.deepEqual(columnWidths(decimalRows), [
        { before: 2, after: 3 },
        { before: 0, after: 7 },
    ]);
});

test("ReScript alignTupleFields pads decimal points and trailing gaps", () => {
    assert.deepEqual(alignTupleFields(decimalRows), [
        [" 8.0,  ", "Central"],
        ["45.6,  ", "Airport"],
        [" 6.77, ", "Park"],
    ]);
});

test("mutation: dropping decimal before-alignment mismatches the helper", () => {
    const wrong = decimalRows.map((row) =>
        row.map((cell, col) => (col === 0 ? { ...cell, before: 0 } : cell)));
    const good = alignTupleFields(decimalRows);
    const mutated = alignTupleFields(wrong);
    assert.notDeepEqual(mutated, good, "zeroing before must change padding");
    assert.match(mutated[1][0], /^45\.6/, "mutated path left-aligns the wider mantissa");
    assert.match(good[0][0], /^ 8\.0/, "correct path keeps the shorter mantissa indented");
});

test("integer right-alignment uses before width only", () => {
    const rows = [
        [
            { text: "8", before: 1, after: 0 },
            { text: "A", before: 0, after: 1 },
        ],
        [
            { text: "126", before: 3, after: 0 },
            { text: "Library", before: 0, after: 7 },
        ],
    ];
    assert.deepEqual(alignTupleFields(rows), [
        ["  8, ", "A"],
        ["126, ", "Library"],
    ]);
});

// TypeScript always passes rectangular rows. The helper still tolerates ragged
// input so a short row does not invent widths and an extra cell is left as-is.
test("ragged rows: missing cells keep column maxima; extra cells stay unpadded", () => {
    const shortSecond = [
        [
            { text: "8.0", before: 1, after: 2 },
            { text: "Central", before: 0, after: 7 },
        ],
        [{ text: "45.6", before: 2, after: 2 }],
    ];
    assert.deepEqual(columnWidths(shortSecond), [
        { before: 2, after: 2 },
        { before: 0, after: 7 },
    ]);
    // Short row still gets a non-last-column separator; it does not invent a second cell.
    assert.deepEqual(alignTupleFields(shortSecond), [
        [" 8.0, ", "Central"],
        ["45.6, "],
    ]);
    assert.equal(alignTupleFields(shortSecond)[1].length, 1);

    const longSecond = [
        [{ text: "8", before: 1, after: 0 }],
        [
            { text: "12", before: 2, after: 0 },
            { text: "extra", before: 0, after: 5 },
        ],
    ];
    assert.deepEqual(columnWidths(longSecond), [{ before: 2, after: 0 }]);
    assert.deepEqual(alignTupleFields(longSecond), [[" 8"], ["12", "extra"]]);
    assert.equal(alignTupleFields([[]])[0].length, 0);
});
