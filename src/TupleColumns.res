/**
 * Pure tuple-column padding: column maxima and pad spaces from typed cells.
 * TypeScript owns discovery, width measurement, printWidth gating, and write-back.
 * Callers pass rectangular rows (same column count); ragged rows are tolerated
 * defensively (missing cells skip the max update; cells past the first row's
 * width are returned without padding).
 *
 * Bindings use plain JS Array methods so the emitted .res.mjs needs no runtime package.
 */

type cell = {
  text: string,
  before: int,
  after: int,
}

type columnWidth = {
  before: int,
  after: int,
}

@send
external jsReduce: (array<'a>, ('acc, 'a, int) => 'acc, 'acc) => 'acc = "reduce"

@send
external jsMap: (array<'a>, ('a, int) => 'b) => array<'b> = "map"

%%private(
  let spaces = (count: int): string =>
    if count <= 0 {
      ""
    } else {
      String.repeat(" ", count)
    }

  let maxInt = (a: int, b: int): int =>
    if a >= b {
      a
    } else {
      b
    }
)

/** Column before/after maxima used by padding. Exported for unit tests. */
let columnWidths = (rows: array<array<cell>>): array<columnWidth> =>
  switch rows[0] {
  | None => []
  | Some(first) =>
    jsMap(first, (_cell, col) =>
      jsReduce(
        rows,
        (acc, row, _i) =>
          switch row[col] {
          | None => acc
          | Some(cell) => {
              before: maxInt(acc.before, cell.before),
              after: maxInt(acc.after, cell.after),
            }
          },
        {before: 0, after: 0},
      )
    )
  }

/** Return each cell as `leading + text + optional ", " + trailing` for join into a tuple line. */
let alignTupleFields = (rows: array<array<cell>>): array<array<string>> => {
  let widths = columnWidths(rows)
  let lastCol = Array.length(widths) - 1
  jsMap(rows, (row, _rowIndex) =>
    jsMap(row, (cell, col) =>
      switch widths[col] {
      | None => cell.text
      | Some(width) => {
          let leading = spaces(width.before - cell.before)
          let separator = if col == lastCol {
            ""
          } else {
            ", " ++ spaces(width.after - cell.after)
          }
          leading ++ cell.text ++ separator
        }
      }
    )
  )
}
