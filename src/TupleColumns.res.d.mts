/** Cells already measured by TypeScript (`before`/`after` display widths). */
export type TuplePadCell = {
    text: string;
    before: number;
    after: number;
};

export type TupleColumnWidth = {
    before: number;
    after: number;
};

/** Column maxima over every row. */
export function columnWidths(rows: TuplePadCell[][]): TupleColumnWidth[];

/**
 * Pad each cell with leading spaces and inter-column `", "` trailing spaces.
 * The last column has no trailing separator. Callers join fields and add indent/parens/suffix.
 */
export function alignTupleFields(rows: TuplePadCell[][]): string[][];
