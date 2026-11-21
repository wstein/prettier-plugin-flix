# Contributing to Prettier Plugin for Flix

Use [GitHub Issues](https://github.com/wstein/prettier-plugin-flix/issues) to report bugs or discuss changes. For a formatter problem, include a small Flix snippet, the actual and expected output, and the plugin, Prettier and Flix versions you used. For a Playground problem, include the steps to reproduce it and your browser version.

| Tool | Needed for |
| --- | --- |
| Node.js 22 and npm | Installing the locked dependencies, generating the parser, and running tests |
| Java 21 | Running the Flix compiler, compiler oracle, or standard-library check |
| Hugo 0.154.5 | Building the fixture catalog and Playground |
| Playwright Chromium | Testing the built site in a browser with `npx playwright install --with-deps chromium` |

Start with `npm ci`. The grammar archive is pinned in the lockfile and fetched over HTTPS. See the [development guide](docs/development.md) for the site, browser, and compiler commands.

For a formatting change, add or update a [fixture](docs/fixtures.md) and run:

```sh
npm test
npm run coverage:syntax -- --check
```

See the [formatting style](docs/formatting.md) for the layouts the plugin aims to produce.

Use a scoped Conventional Commit subject for your commits and PR title, such as `fix(formatter): preserve indented argument comments`. If the subject needs more context for release notes, add a `Changelog:` trailer to the commit message. For a rebase merge, include the trailer on the commit that carries the change. See the [commit and changelog guidance](AGENTS.md#write-commits-and-changelog-entries) for examples.

Follow the [code of conduct](CODE_OF_CONDUCT.md) when participating.
