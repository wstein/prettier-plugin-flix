# prettier-plugin-flix

![Prettier Plugin for Flix — code formatting for Flix](branding/banner.png)

[![CI status on main](https://github.com/wstein/prettier-plugin-flix/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/wstein/prettier-plugin-flix/actions/workflows/ci.yml)
[![Line coverage on main](https://img.shields.io/endpoint?url=https%3A%2F%2Fwstein.github.io%2Fprettier-plugin-flix%2Fcoverage%2Flines.json)](https://github.com/wstein/prettier-plugin-flix/actions/workflows/fixture-docs.yml?query=branch%3Amain)
[![Branch coverage on main](https://img.shields.io/endpoint?url=https%3A%2F%2Fwstein.github.io%2Fprettier-plugin-flix%2Fcoverage%2Fbranches.json)](https://github.com/wstein/prettier-plugin-flix/actions/workflows/fixture-docs.yml?query=branch%3Amain)
[![npm version](https://img.shields.io/npm/v/prettier-plugin-flix)](https://www.npmjs.com/package/prettier-plugin-flix)
[![Tested with Flix 0.80.0](https://img.shields.io/badge/tested_with_Flix-0.80.0-cf4647)](https://github.com/flix/flix/releases/tag/v0.80.0)
[![Open the Flix Playground](https://img.shields.io/badge/live-playground-1953a2)](https://wstein.github.io/prettier-plugin-flix/playground/)
[![Read the formatting style](https://img.shields.io/badge/styling-rules-6d28d9)](https://wstein.github.io/prettier-plugin-flix/formatting/)

Format Flix source files with Prettier. Start with one file, preview the result, and write it back when you’re happy with it.

**[See before-and-after examples](https://wstein.github.io/prettier-plugin-flix/examples/) · [Browse the fixture catalog](https://wstein.github.io/prettier-plugin-flix/)**

## A first example

**Before**

```flix
def label(code:Int32):String=
match code{
case 200=>"OK" // Request completed
case 404 =>"Not found" // Check the requested URL
case _ =>"Other" // Fallback for unknown codes
}
```

**After**

```flix
def label(code: Int32): String =
    match code {
        case 200 => "OK"         // Request completed
        case 404 => "Not found"  // Check the requested URL
        case _   => "Other"      // Fallback for unknown codes
    }
```

[Open this example in the Playground](https://wstein.github.io/prettier-plugin-flix/playground/#code=ZGVmIGxhYmVsKGNvZGU6SW50MzIpOlN0cmluZz0KbWF0Y2ggY29kZXsKY2FzZSAyMDA9PiJPSyIgLy8gUmVxdWVzdCBjb21wbGV0ZWQKY2FzZSA0MDQgPT4iTm90IGZvdW5kIiAvLyBDaGVjayB0aGUgcmVxdWVzdGVkIFVSTApjYXNlIF8gPT4iT3RoZXIiIC8vIEZhbGxiYWNrIGZvciB1bmtub3duIGNvZGVzCn0K)

## Try it in a project

Install Prettier and the prebuilt plugin from npm. Plugin version 0.2.0 was
tested with Flix 0.79.0 and 0.80.0.

```sh
npm install --save-dev --save-exact prettier@3.10.1 prettier-plugin-flix
```

Add the plugin to your `.prettierrc.json`.

```json
{
  "plugins": ["prettier-plugin-flix"],
  "flixVersion": "0.80.0"
}
```

`flixVersion` selects the exact Flix compiler grammar. Omit it to keep the
current default (`0.80.0`). Supported values are `0.79.0` and `0.80.0`;
unsupported values fail with a clear error. The CLI flag is `--flix-version`.

Projects that pin different Flix compilers in one repository can override the
version per path:

```json
{
  "plugins": ["prettier-plugin-flix"],
  "flixVersion": "0.80.0",
  "overrides": [
    {
      "files": ["legacy/**/*.flix"],
      "options": { "flixVersion": "0.79.0" }
    }
  ]
}
```

Run this against a file in your project.

```sh
npx prettier src/Main.flix
npx prettier --check src/Main.flix
npx prettier --write src/Main.flix
npx prettier --plugin prettier-plugin-flix --flix-version 0.80.0 src/Main.flix
```

The first command previews the result in your terminal. `--check` reports
formatting differences, and `--write` saves the result. Pass `--plugin
prettier-plugin-flix` with `--flix-version` on the CLI so Prettier registers
the flag before it loads plugins from `.prettierrc.json`; without `--plugin`,
Prettier 3 warns that `--flix-version` is unknown and still applies the value.
The Flix style uses four spaces per indent and a target width of 100 columns.
Set `printWidth` in your Prettier configuration to adjust the width.

## Learn more

- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
- [Flix formatting style and options](docs/formatting.md)
- [Write and update Markdown fixtures](docs/fixtures.md)
- [Build, run checked formatting, and verify coverage](docs/development.md)
