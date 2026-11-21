# Width heatmap (optional R)

Visualize before-and-after sweep exports from [#206](https://github.com/wstein/prettier-plugin-flix/issues/206)
across print widths. The first example is the two [#201](https://github.com/wstein/prettier-plugin-flix/issues/201)
repros at every integer width from 20 to 160.

This directory is **not** part of the published plugin or of `npm test`. R and ggplot2 are optional.

## Sample

`sample/base.json` and `sample/candidate.json` are pinned schema-v1 exports:

- two cases (`equals-own-line`, `hug-match-own-line`);
- candidate failures at widths 30 and 35;
- a skipped cell and a gap in the width range so **missing** observations appear.

## Collect real exports

Build the plugin, then run an idempotence export for the widths you care about (here 20–160). Point
`--only` at the fixture names that hold the repros, or pass the `.flix` / fixture paths directly:

```sh
npm run build
widths=$(seq -s, 20 160)
npm run review:sweep -- idempotence --widths "$widths" --only own-line --export analysis/width-heatmap/out/candidate.json
# On the base revision (or with a second checkout):
npm run review:sweep -- idempotence --widths "$widths" --only own-line --export analysis/width-heatmap/out/base.json
```

Or build a tiny grid from named snippets without sweeping the whole corpus:

```sh
node analysis/width-heatmap/export-repro-grid.mjs \
  --base-revision main --candidate-revision HEAD \
  --out-dir analysis/width-heatmap/out
```

## Render

Rebuild the committed sample (Node, no R):

```sh
node analysis/width-heatmap/build-sample.mjs
```

That writes `sample/heatmap.svg` and `sample/changed-widths.tsv`. With R and ggplot2:

```sh
Rscript analysis/width-heatmap/plot-width-heatmap.R \
  --base analysis/width-heatmap/sample/base.json \
  --candidate analysis/width-heatmap/sample/candidate.json \
  --out analysis/width-heatmap/out/heatmap.svg
```

The R script also writes `changed-widths.tsv` next to the figure: one row per case whose status
differs between base and candidate, listing the changed widths.
Install with `install.packages(c("ggplot2", "jsonlite"))` when you want the ggplot2 panels.
