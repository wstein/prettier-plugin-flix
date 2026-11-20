# prettier-plugin-flix

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

## Try it in a project

Install Prettier and the prebuilt plugin from the GitHub release. Plugin version
0.1.0 was tested with Flix 0.80.0.

```sh
npm install --save-dev --save-exact prettier@3.10.1 \
  https://github.com/wstein/prettier-plugin-flix/releases/download/v0.1.0/prettier-plugin-flix-0.1.0.tgz
```

Add the plugin to your `.prettierrc.json`.

```json
{
  "plugins": ["prettier-plugin-flix"]
}
```

Run this against a file in your project.

```sh
npx prettier src/Main.flix
npx prettier --check src/Main.flix
npx prettier --write src/Main.flix
```

The first command previews the result in your terminal. `--check` reports
formatting differences, and `--write` saves the result. The Flix style uses
four spaces per indent and a target width of 100 columns. Set `printWidth`
in your Prettier configuration to adjust the width.

## Learn more

- [Flix formatting style and options](docs/formatting.md)
- [Write and update Markdown fixtures](docs/fixtures.md)
- [Build, run checked formatting, and verify coverage](docs/development.md)
