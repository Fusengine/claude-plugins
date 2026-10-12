#!/usr/bin/env bash
# Regenerate the fuse-statusline demo film.
# Regenerate:  bash docs/demo/statusline-mod/render.sh [workDir]   (from anywhere)
# Output:      docs/img/statusline-mod.mp4  (H.264, 1600 px, < 4 MB)
#              docs/img/statusline-mod.gif  (960 px, < 6 MB)
# Needs:       bun, ffmpeg, Chrome or Chromium (CHROME_BIN overrides the lookup).
# Preview:     open docs/demo/statusline-mod/index.html after one render
#              (motion-bundle.js is generated); it plays itself in a loop.
set -euo pipefail
exec bun "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/motion-render.js" "$@"
