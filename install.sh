#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source_dir="$repo_dir/pet"
codex_data_dir="${CODEX_HOME:-$HOME/.codex}"
target_dir="$codex_data_dir/pets/cici"

if [[ ! -f "$source_dir/pet.json" || ! -f "$source_dir/spritesheet.webp" ]]; then
  printf 'Cici pet package is incomplete.\n' >&2
  exit 1
fi

if command -v sips >/dev/null 2>&1; then
  width="$(sips -g pixelWidth "$source_dir/spritesheet.webp" | awk '/pixelWidth:/ {print $2}')"
  height="$(sips -g pixelHeight "$source_dir/spritesheet.webp" | awk '/pixelHeight:/ {print $2}')"
  if [[ "$width" != "1536" || "$height" != "2288" ]]; then
    printf 'Unexpected spritesheet dimensions: %sx%s (expected 1536x2288).\n' "$width" "$height" >&2
    exit 1
  fi
fi

mkdir -p "$target_dir"
cp "$source_dir/pet.json" "$source_dir/spritesheet.webp" "$target_dir/"

printf 'Installed Cici to %s\n' "$target_dir"
printf 'Restart Codex, then select Cici from custom pets.\n'
