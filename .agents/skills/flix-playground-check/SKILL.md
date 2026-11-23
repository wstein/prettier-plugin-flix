---
name: flix-playground-check
description: Verify the Flix Playground and embedded editors. Use for changes to live formatting, code handoffs, syntax diagnostics, partial previews, editor controls, or the generated fixture site.
---

# Verify the Flix editor in the browser

Work from the plugin repository root. Install the development dependencies
according to the [development guide](../../../docs/development.md). Use the
Hugo version pinned in the [site workflow](../../../.github/workflows/fixture-docs.yml).

```sh
npm run docs:build
hugo server --source docs --baseURL http://localhost:1313/ --bind 127.0.0.1
```

The build regenerates the catalog and checks the published formatter bundle.
Run the [Chromium smoke test](../../../docs/development.md#verify-the-playground-in-chromium)
after building. Use a browser for interactions involving the editor, status bar, layout,
worker timing, or navigation.

## Check the affected flows

- **Standalone.** Open `/playground/`. Check the starting width of 100 columns,
  fixed four-space indentation, and the input and preview panes. Choose a
  curated fixture, edit it, and check that the preview refreshes after the
  250 ms debounce. When checking cursor status, move the cursor and select
  text using the keyboard.
- **Embedded.** Open a fixture chapter such as `/comments/` and scroll a case
  into view to initialize its editor. Check its 60-column default and the
  shared controls. After editing, use **Open in Playground**. The Playground
  should load the edited source with an empty Example selection. It should
  start at 100 columns when the embedded width was left at its default and
  carry an explicitly selected width through the handoff. Include Unicode
  in the edited source when testing transfer.
- **Diagnostics.** Introduce a syntax error between otherwise valid
  declarations. Check the marked input location and concise message. Verify
  that independently parseable code still formats in the preview and the
  invalid source stays intact. Correct the error and check that the marker
  clears and the full preview returns.
- **Controls and appearance.** When changing the toolbar or layout, check
  the affected controls in both editor modes. Verify the Formatted/Diff
  toggle, **Use formatted** on the input header (including from Diff, with undo), Clear, Copy,
  and dark mode or a narrow viewport when relevant.

Keep new Playground examples backed by tested Markdown fixtures. Change the
fixture, exporter, or site source rather than the generated bundle. Report
the routes, interactions and observed results. Record browser checks and
automated build checks separately.
