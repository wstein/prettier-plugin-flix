# Working on prettier-plugin-flix

This repository ships a Prettier plugin for Flix, a fixture catalog, and a
browser Playground. Use [the formatting style](docs/formatting.md) for layout
decisions and [the development guide](docs/development.md) for command details.

## Start here

Use Node.js 22, as CI does. The lockfile pins an HTTPS archive of the ANTLR grammar to a Git commit.

```sh
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

Use the [formatting-rule skill](.agents/skills/flix-formatting-rule/SKILL.md)
for the fixture-to-review workflow.

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
- Measurement does not change the output. Measuring functions return widths,
  never docs. Decide in pass 1 as pass 2 will see it: the comment kind changes
  during formatting. Add no mode fields to the printer. Every new measuring
  site needs a fixture that fails without it, and so does every new condition.
- Idempotence on the Flix standard library is a required check for formatter
  pull requests: set `FLIX_STDLIB_DIR` and run
  `npm run review:sweep -- idempotence --no-repo` (eight widths, three
  `--shard k/3` processes, `node --max-old-space-size=1100`). The result is
  0 new failures against `main`. The workflow Stdlib idempotence runs it
  in CI for pull requests that touch `src/**` (see docs/development.md).
- For changes in `src/`, also run the comment-site sweep (the workflow
  Comment sites full sweep runs it in CI once the workflow is on `main`) and
  `npm run review:pairs` (the pair and triple test).
- Mutate each new branch of logic. A surviving mutation of the new logic is a
  finding. See the
  [review triage skill](.agents/skills/flix-review-triage/SKILL.md).

## Change the Playground or fixture site

Use the [Playground check skill](.agents/skills/flix-playground-check/SKILL.md)
for browser checks.

- Use the shared workbench for the standalone Playground and embedded editors.
  The plugin and standalone Playground default to 100 columns. Embedded
  editors default to 60. An embedded handoff carries an explicit width override.
  The web editors use four spaces and refresh the preview after a 250 ms pause.
- Verify the handoff with an edited snippet. It should load that source and
  leave the Playground example selector empty. For diagnostic changes, verify
  the marked input span and the preview both before and after correcting an
  error. Keep the message short and put the location on the editor itself.
- Keep Playground examples backed by tested fixtures. Run `npm run docs:build`
  with Hugo installed to regenerate the site and run the Playground checks.
  Edit the fixtures, exporter or site source to change generated content.

## Verify against upstream Flix

- For the official examples, follow [the audit guide](docs/official-examples.md).
  Use the [documentation audit skill](.agents/skills/flix-docs-audit/SKILL.md)
  to triage a run and prepare findings. Check the Flix book's Markdown blocks
  and the website's JavaScript examples. Review the before-and-after output and
  record a reason for accepted layout changes. Keep documented upstream issues
  separate from formatter findings.
- Preserve the original audit input. The comparison ignores trailing spaces and
  tabs. If a weekly run detects drift, review the artifact and the individual
  changes before updating the assessment hashes or baseline. Snippets may need
  surrounding context to compile. Use the pinned Flix compiler to distinguish
  source syntax errors from missing context and formatter regressions.
- The standard library workflow uses the official Flix release JAR and Java 21
  to compile both the original and the Prettier-formatted sources with
  `--Xlib nix`. See [the development guide](docs/development.md#compile-the-formatted-standard-library)
  for the local command and exact-tag workflow input.

## Work with pull requests and reviews

Use the [review triage skill](.agents/skills/flix-review-triage/SKILL.md) for
reviews and issue triage. The labels, reach levels and the definition of a
blocking finding are in
[Issue triage and labels](docs/development.md#issue-triage-and-labels).

- Open every pull request as a draft with a named blocker. Only a helper sets
  Ready, after a CLEAR review of the exact head. Do not push to a branch with an
  open review without stating in the PR which findings the push addresses.
- One pull request has one topic and at most one scope: formatter, or
  workflow and documentation, or tooling. Two topics are two pull requests. Do
  not combine unrelated issues in one pull request. An epic batch may close
  up to 5 issues or lines of one class (`Closes #n` or `Refs #n` for each),
  see [Epics](docs/development.md#epics). A pull request may join
  two scopes at most when each scope checks the other, for example a workflow
  and the formatter code that its paths cover. The PR text names what each scope
  checks in the other and why the PR is an exception. Each scope gets its own
  independent review.
- A blocking finding is defined in
  [Issue triage and labels](docs/development.md#issue-triage-and-labels).
  A `reach:synthetic` finding does not block. It is a line in the epic
  (label `epic`) of its class, not an issue of its own.
- Triage issues by type, area, class and reach.
- Reviewer rules: the quiet period, the delta review, the follow-up review
  and the CLEAR carry-over are in the
  [review triage skill](.agents/skills/flix-review-triage/SKILL.md). Write
  nothing outside the scratch folder (no `/tmp`), do not use `git -c user.*`,
  `pkill` or `pgrep -f`, and check free memory before heavy runs.
- Review labels are `review:clear`, `review:nits`, `review:blocking` and
  `review:findings`. The helper sets them, not the reviewer. A new head clears
  all of them until a review of that head exists.
- Use rebase only, never a merge commit. The ruleset `Protect main` requires
  linear history and rebase merge. A branch holds no merge commit. Use "Update
  branch" only as a rebase. Rebase another agent's branch only with the owner's
  explicit approval and `--force-with-lease=<ref>:<SHA>`.

## Write commits and changelog entries

- Use scoped Conventional Commits for commit subjects, which land on `main`
  through a rebase merge, and for PR titles. Write
  `type(scope): imperative summary`, with a scope such as `formatter`,
  `parser`, `playground`, `catalog`, or `release`.
  Use `feat`, `fix`, `perf`, `docs`, `test`, `refactor`, `build`, `ci`, or
  `chore` according to the change.
- Describe the user-visible result in the subject. Add an optional
  `Changelog: ...` trailer when the subject needs a clearer release-note entry.
  Put the trailer in the final paragraph alongside any `Co-authored-by:`
  trailers. The draft warns about misplaced trailers on stderr.
  Mention when an intentional layout change may reformat existing files. For
  an incompatible change to a supported interface, use `!` in the subject or
  a `BREAKING CHANGE:` footer and explain the migration.
- Build [the changelog](CHANGELOG.md) from the default branch and release tags.
  Run `npm run --silent changelog:draft` and review the draft before release.
  Put changes after the newest tag in `Unreleased`. Group related commits into
  one entry, link the commits or PRs, and include user-visible documentation,
  compatibility, and distribution changes. Omit routine maintenance and
  release bumps. Classify older unprefixed commits by their actual changes.

```text
fix(formatter): preserve indented argument comment continuations

Changelog: Keep a continued comment with the argument it describes.
```

## Publish and verify a release

- Version the plugin independently of Flix. Record exact tested Flix versions
  in the release notes. New Flix releases that pass compatibility checks can
  be added to the notes for the verified package.
- Use the [release workflow](.github/workflows/release.yml) and the
  [release procedure](docs/development.md#publish-a-plugin-release). Verify that
  the public GitHub tarball installs in a fresh project and can format and
  check a Flix file through Prettier.
