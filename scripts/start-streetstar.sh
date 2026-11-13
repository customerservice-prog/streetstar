#!/bin/sh
set -eu
# Ensure the mounted volume is writable, then run the web app as non-root.
if [ -d /data/viral-media ] && grep -q ' /data/viral-media ' /proc/self/mountinfo; then
  mkdir -p /data/viral-media/incoming /data/viral-media/files
  chown node:node /data/viral-media /data/viral-media/incoming /data/viral-media/files
  chmod 750 /data/viral-media /data/viral-media/incoming /data/viral-media/files
fi
exec su -p -s /bin/sh node -c 'node scripts/init-db.mjs && exec ./node_modules/.bin/next start --hostname 0.0.0.0 --port ${PORT:-3000}'
