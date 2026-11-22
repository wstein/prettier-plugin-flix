#!/usr/bin/env Rscript
# Optional ggplot2 heatmap over schema-v1 sweep exports (#207).
# Usage:
#   Rscript analysis/width-heatmap/plot-width-heatmap.R \
#     --base sample/base.json --candidate sample/candidate.json --out out/heatmap.svg

args <- commandArgs(trailingOnly = TRUE)
opt <- list(base = NULL, candidate = NULL, out = "heatmap.svg", widths = NULL)
i <- 1
while (i <= length(args)) {
  if (args[[i]] %in% c("--base", "--candidate", "--out", "--widths") && i < length(args)) {
    opt[[substring(args[[i]], 3)]] <- args[[i + 1]]
    i <- i + 2
  } else {
    stop("Unknown or incomplete argument: ", args[[i]])
  }
}
if (is.null(opt$base) || is.null(opt$candidate)) {
  stop("Need --base and --candidate JSON exports")
}

if (!requireNamespace("jsonlite", quietly = TRUE) || !requireNamespace("ggplot2", quietly = TRUE)) {
  stop("Install ggplot2 and jsonlite: install.packages(c(\"ggplot2\", \"jsonlite\"))")
}

library(jsonlite)
library(ggplot2)

read_doc <- function(path) {
  doc <- fromJSON(path, simplifyDataFrame = TRUE)
  if (is.null(doc$schemaVersion) || doc$schemaVersion != 1) {
    stop("Unsupported schemaVersion in ", path)
  }
  doc
}

base <- read_doc(opt$base)
cand <- read_doc(opt$candidate)

axis_widths <- if (!is.null(opt$widths)) {
  as.integer(strsplit(opt$widths, ",", fixed = TRUE)[[1]])
} else {
  sort(unique(c(base$config$widths, cand$config$widths, base$cases$width, cand$cases$width)))
}

files <- sort(unique(c(base$cases$file, cand$cases$file)))

# One status per file and width. A sites export has several cases per cell: keep
# the worst (fail > skipped > pass, as CASE_STATUS_SEVERITY in scripts/sweep-results.mjs).
status_rank <- c(pass = 1, skipped = 2, fail = 3)
worst_cases <- function(cases) {
  if (is.null(cases) || NROW(cases) == 0) {
    return(data.frame(file = character(), width = integer(), status = character(), stringsAsFactors = FALSE))
  }
  cases <- cases[order(-status_rank[cases$status]), c("file", "width", "status")]
  cases[!duplicated(cases[, c("file", "width")]), ]
}
base_cases <- worst_cases(base$cases)
cand_cases <- worst_cases(cand$cases)

expand <- function(doc, role, cases) {
  grid <- expand.grid(file = files, width = axis_widths, stringsAsFactors = FALSE)
  merged <- merge(grid, cases, by = c("file", "width"), all.x = TRUE)
  merged$status[is.na(merged$status)] <- "missing"
  merged$role <- role
  merged$revision <- substr(doc$formatter$revision, 1, 12)
  merged$panel <- paste(role, merged$revision, sep = " · ")
  merged
}

rows <- rbind(expand(base, "base", base_cases), expand(cand, "candidate", cand_cases))
rows$status <- factor(rows$status, levels = c("pass", "fail", "skipped", "missing"))
rows$panel <- factor(rows$panel, levels = unique(rows$panel))

colors <- c(pass = "#2ca02c", fail = "#d62728", skipped = "#ff7f0e", missing = "#c7c7c7")

p <- ggplot(rows, aes(x = width, y = file, fill = status)) +
  geom_tile(color = "white", linewidth = 0.1) +
  facet_wrap(~panel, ncol = 1) +
  scale_fill_manual(values = colors, drop = FALSE) +
  scale_x_continuous(breaks = pretty(axis_widths, n = 12)) +
  labs(x = "print width", y = NULL, fill = NULL, title = "Formatter width heatmap") +
  theme_bw(base_size = 11) +
  theme(panel.grid = element_blank(), legend.position = "bottom")

out <- opt$out
dir.create(dirname(out), recursive = TRUE, showWarnings = FALSE)
ext <- tolower(tools::file_ext(out))
if (ext == "png") {
  ggsave(out, p, width = 12, height = 4 + length(files), dpi = 120)
} else {
  ggsave(out, p, width = 12, height = 4 + length(files))
}

# Compact table of changed widths
base_status <- setNames(base_cases$status, paste(base_cases$file, base_cases$width, sep = "|"))
cand_status <- setNames(cand_cases$status, paste(cand_cases$file, cand_cases$width, sep = "|"))
keys <- sort(unique(c(names(base_status), names(cand_status), paste(rep(files, each = length(axis_widths)), axis_widths, sep = "|"))))
changes <- list()
for (key in keys) {
  parts <- strsplit(key, "|", fixed = TRUE)[[1]]
  file <- parts[[1]]
  width <- as.integer(parts[[2]])
  b <- if (key %in% names(base_status)) base_status[[key]] else "missing"
  cstat <- if (key %in% names(cand_status)) cand_status[[key]] else "missing"
  if (b != cstat) {
    id <- paste(file, b, cstat, sep = "\t")
    if (is.null(changes[[id]])) changes[[id]] <- integer()
    changes[[id]] <- c(changes[[id]], width)
  }
}
tsv <- file.path(dirname(out), "changed-widths.tsv")
con <- file(tsv, "w")
writeLines("file\tfrom\tto\twidths", con)
for (id in sort(names(changes))) {
  parts <- strsplit(id, "\t", fixed = TRUE)[[1]]
  writeLines(sprintf("%s\t%s\t%s\t%s", parts[[1]], parts[[2]], parts[[3]], paste(sort(changes[[id]]), collapse = ",")), con)
}
close(con)
message("Wrote ", out, " and ", tsv)
