---
name: flix-formatting-rule
description: Change a formatting rule in prettier-plugin-flix. Use for line wrapping, indentation, operator placement, alignment, or comment layout regressions.
---

# Change a Flix formatting rule

Work from the plugin repository root. Read the relevant section of the
[formatting style](../../../docs/formatting.md) and find the closest existing
case in `test/fixtures/`.

## Reproduce and implement

1. Reduce the issue to a valid Flix snippet and record the desired output in a
   Markdown fixture. Follow the [fixture guide](../../../docs/fixtures.md). For
   width-dependent behavior, include a compact case and a width that forces
   the intended break. Add comments or a nested construct when they affect
   the decision.
2. Build the plugin and run the selected fixture to confirm that it fails at
   the expected difference. The test name includes its fixture name and title.

   ```sh
   npm run build
   node --test --test-name-pattern 'distinctive fixture name or title' test/fixtures.test.mjs
   ```

3. Find the printer branch that owns the construct or the comment-layout pass
   that owns the gap. Keep compact forms when they fit and prefer breaks at
   syntactic boundaries. Use the parser or grammar only when the failure is
   in parsing. Fix grammar rules in the pinned grammar source upstream and
   regenerate the parser through the build.
4. Run the selected fixture again. Preserve tokens, comments and parse-tree
   shape and check that a second format produces the same output.

## Check the impact

- Run `npm test` and `npm run coverage:syntax -- --check`. If an intentional
  change affects other fixtures, review every diff from `npm run test:update`
  before including it. Keep unrelated fixture changes out.
- Update the linked style reference when the result changes a documented
  rule. For changes that reach beyond the local fixture, run the
  [official examples audit](../flix-docs-audit/SKILL.md) and review its diffs.
- Report the chosen rule with a compact before-and-after example and the
  widths tested. Link the regression fixture and call out any remaining
  cases that still differ from the intended layout.
- Run the standard library idempotence sweep and mutate each new condition
  before requesting a review. The
  [review triage skill](../flix-review-triage/SKILL.md) lists the commands.
