#!/usr/bin/env bash

# Usage
#   cd <target-project-root>
#   bash aie-os/tools/build-latest-aie-os.sh

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "$0")" && pwd)"
AIE_OS_PATH="$(cd -- "$SCRIPT_DIR/.." && pwd)"

if [ ! -d "$AIE_OS_PATH" ] || [ ! -d "$AIE_OS_PATH/.git" ]; then
  echo "AIE OS repository not found next to tools/ at $AIE_OS_PATH."
  exit 1
fi

cd "$AIE_OS_PATH"
git pull origin main
pnpm run build
echo "AIE OS is at latest and ready to run init and build."
