#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
source_dir="$script_dir/pet"
codex_data_dir="${CODEX_HOME:-$HOME/.codex}"
target_dir="$codex_data_dir/pets/cici"

finish() {
  printf '\nPress any key to close this window...'
  IFS= read -r -n 1 _
  printf '\n'
}

trap finish EXIT

if [[ ! -f "$source_dir/pet.json" || ! -f "$source_dir/spritesheet.webp" ]]; then
  printf 'Installation failed: the Cici pet package is incomplete.\n' >&2
  exit 1
fi

mkdir -p "$target_dir"
cp "$source_dir/pet.json" "$source_dir/spritesheet.webp" "$target_dir/"

printf '\nCici was installed successfully.\n'
printf 'Installed to: %s\n' "$target_dir"
printf 'Fully quit and reopen Codex, then select Cici from custom pets.\n'

