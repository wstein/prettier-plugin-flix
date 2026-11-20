#!/usr/bin/env bash
# Run npm run build first, then pass a Flix release jar and its tag.
set -euo pipefail

if [[ $# -ne 2 || ! "$2" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Usage: bash scripts/check-flix-stdlib.sh <flix.jar> <vMAJOR.MINOR.PATCH>" >&2
    exit 2
fi

jar=$(realpath "$1")
version=${2#v}
if [[ $(java -jar "$jar" --version) != "The Flix Programming Language $version" ]]; then
    echo "The compiler in $jar did not report Flix $version." >&2
    exit 1
fi

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
work=$(mktemp -d)
trap 'rm -rf -- "$work"' EXIT
mkdir -p "$work/original" "$work/formatted"

# A release jar contains tests and benchmarks alongside the bundled library.
unzip -q "$jar" 'src/library/*.flix' -d "$work"
mv "$work/src/library" "$work/original/src"
printf '[package]\nversion = "0.1.0"\nflix = "%s"\n' "$version" > "$work/original/flix.toml"
cp -R "$work/original/." "$work/formatted/"

compile() (
    cd "$work/$1"
    echo "Compiling the $1 standard library with Flix $version"
    # Use only these sources, with no fallback to the library inside the jar.
    COURSIER_CACHE="$work/coursier" java -jar "$jar" build-classes --no-install --Xlib nix
    find build/class -type f -name '*.class' | LC_ALL=C sort > "$work/$1-classes.txt"
    test -s "$work/$1-classes.txt"
)

compile original

mapfile -d '' -t files < <(find "$work/formatted/src" -type f -name '*.flix' -print0 | sort -z)
echo "Checking and formatting ${#files[@]} Flix source files"
if ! node "$repo_root/scripts/format-checked.mjs" "${files[@]}" > "$work/format.log"; then
    cat "$work/format.log"
    exit 1
fi

compile formatted

summary="Flix $version: compiled the original and formatted standard library (${#files[@]} source files, $(wc -l < "$work/format.log") reformatted, $(wc -l < "$work/formatted-classes.txt") class files from the formatted copy)."
echo "$summary"
if [[ -n ${GITHUB_STEP_SUMMARY:-} ]]; then
    printf '%s\n' "$summary" >> "$GITHUB_STEP_SUMMARY"
fi
