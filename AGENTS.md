# Working on prettier-plugin-flix

This repository ships a Prettier plugin for Flix, a fixture catalog, and a
browser Playground. Use [the formatting style](docs/formatting.md) for layout
decisions and [the development guide](docs/development.md) for command details.

## Start here

Use Node.js 22, as CI does. The lockfile pins the ANTLR grammar to a Git commit.
A clean checkout without GitHub SSH access can install it over HTTPS.

```sh
git config --local url."https://github.com/".insteadOf ssh://git@github.com/
npm ci
npm test
npm run coverage:syntax -- --check
```

- `src/parse.ts` handles strict parsing and diagnostics. `src/print.ts` builds
  Prettier documents. `src/comment-layout.ts` handles comment alignment.
- `src/recover.ts` supports partial formatting for the Playground. Keep the
  normal Prettier entry point strict. Recover complete, independently parseable
  regions and preserve invalid source spans verbatim.
- Build the parser with `npm run build`. Change the pinned grammar upstream
  when the grammar itself needs a fix. The parser files are generated.

## Change formatter behavior

- Reproduce the issue with a minimal Markdown fixture in `test/fixtures/`.
  Use [the fixture guide](docs/fixtures.md) for expected output, width variants
  and compiler references. For wrapping changes, test the compact and wrapped
  forms when the distinction matters.
- Keep short forms compact when they fit and break long forms at syntactic
  boundaries. The style guide describes the established rules for pipelines,
  handlers, Datalog and alignment. Keep the number of plugin-specific style
  options small and use standard Prettier options where appropriate.
- Run the normal tests and syntax coverage check. Fixtures verify tokens,
  comments, parse-tree shape and idempotence as well as expected layout.
  For batch edits to Flix source files, use `npm run format:checked -- <files>`.
- Review each affected fixture when using `npm run test:update`. Update the
  style guide and its fixture references when an intentional change affects
  a documented rule.

## Change the Playground or fixture site

- Use the shared workbench for the standalone Playground and embedded editors.
  The plugin defaults to 100 columns. Standalone starts at 80, including after
  an embedded handoff, and embedded editors start at 60. The web editors use
  four spaces and refresh the preview after a 250 ms pause.
- Verify the handoff with an edited snippet. It should load that source and
  leave the Playground example selector empty. For diagnostic changes, verify
  the marked input span and the preview both before and after correcting an
  error. Keep the message short and put the location on the editor itself.
- Keep Playground examples backed by tested fixtures. Run `npm run docs:build`
  with Hugo installed to regenerate the site and run the Playground checks.
  Edit the fixtures, exporter or site source to change generated content.

## Verify against upstream Flix

- For the official examples, follow [the audit guide](docs/official-examples.md).
  Check the Flix book's Markdown blocks and the website's JavaScript examples.
  Review the before-and-after output and record a reason for accepted layout
  changes. Keep documented upstream issues separate from formatter findings.
- Preserve the original audit input. The comparison ignores trailing spaces and
  tabs. If a weekly run detects drift, review the artifact and the individual
  changes before updating the assessment hashes or baseline. Snippets may need
  surrounding context to compile. Use the pinned Flix compiler to distinguish
  source syntax errors from missing context and formatter regressions.
- The standard library workflow uses the official Flix release JAR and Java 21
  to compile both the original and the Prettier-formatted sources with
  `--Xlib nix`. See [the development guide](docs/development.md#compile-the-formatted-standard-library)
  for the local command and exact-tag workflow input.

## Publish and verify a release

- Version the plugin independently of Flix. Record exact tested Flix versions
  in the release notes. New Flix releases that pass compatibility checks can
  be added to the notes for the verified package.
- Use the [release workflow](.github/workflows/release.yml) and the
  [release procedure](docs/development.md#publish-a-plugin-release). Verify that
  the public GitHub tarball installs in a fresh project and can format and
  check a Flix file through Prettier.
