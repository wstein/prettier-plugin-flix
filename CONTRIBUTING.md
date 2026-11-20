# Contributing to Prettier Plugin for Flix

Use [GitHub Issues](https://github.com/wstein/prettier-plugin-flix/issues) to report bugs or discuss changes. For a formatter problem, include a small Flix snippet, the actual and expected output, and the plugin, Prettier and Flix versions you used. For a Playground problem, include the steps to reproduce it and your browser version.

Run the project using Node.js 22 and follow the setup in the [development guide](docs/development.md). For a formatting change, add or update a [fixture](docs/fixtures.md) and run:

```sh
npm test
npm run coverage:syntax -- --check
```

See the [formatting style](docs/formatting.md) for the layouts the plugin aims to produce.

Use a scoped Conventional Commit subject for your commits and PR title, such as `fix(formatter): preserve indented argument comments`. If the subject needs more context for release notes, add a `Changelog:` trailer to the commit message. For a squash merge, include the trailer in the final commit message. See the [commit and changelog guidance](AGENTS.md#write-commits-and-changelog-entries) for examples.

Follow the [code of conduct](CODE_OF_CONDUCT.md) when participating.
