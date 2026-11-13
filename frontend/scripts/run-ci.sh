#!/usr/bin/env bash
# Runs every frontend check. A passing step prints a single line, a failing step prints its full
# output. All steps run even if one fails, so a single run reports every problem.

set -uo pipefail

# Plain text when the output is not a terminal (CI logs, agents)
if [ ! -t 1 ]; then
  export NO_COLOR=1 FORCE_COLOR=0
fi

log=$(mktemp)
trap 'rm -f "$log"' EXIT
failed=()

step() {
  local name=$1
  shift
  local start=$SECONDS
  if "$@" >"$log" 2>&1; then
    echo "PASS $name ($((SECONDS - start))s)"
  else
    echo "FAIL $name ($((SECONDS - start))s)"
    echo "----- $name output -----"
    if [ -t 1 ]; then
      cat "$log"
    else
      # Some tools (rolldown) ignore NO_COLOR
      sed $'s/\033\\[[0-9;]*m//g' "$log"
    fi
    echo "----- end $name -----"
    # Annotation shown in the GitHub run summary
    if [ -n "${GITHUB_ACTIONS:-}" ]; then
      echo "::error title=$name failed::Run \`pnpm run ci\` in frontend/ to reproduce"
    fi
    failed+=("$name")
  fi
}

check_translations() {
  local missing
  missing=$(grep -Er "\"(\w|-)+\.(\w|-)+\"" public/locales/ || true)
  if [ -z "$missing" ]; then
    return 0
  fi
  echo "$missing"
  echo "$(grep -c '^' <<<"$missing") untranslated entries found"
  return 1
}

step "typecheck (tsc)" tsc
# A failing typecheck makes the build fail on the same errors, so only build typechecked code
if [ ${#failed[@]} -eq 0 ]; then
  step "build (vite)" vite build --sourcemap true
else
  echo "SKIP build (vite): typecheck failed"
fi
step "format (prettier)" prettier --check src/
step "lint (eslint)" eslint 'src/**/*.{ts,tsx}' --report-unused-disable-directives --max-warnings 0
step "test (vitest)" vitest run
step "translations" check_translations

if [ ${#failed[@]} -gt 0 ]; then
  echo
  echo "FAILED: ${failed[*]}"
  exit 1
fi
echo
echo "All checks passed"
