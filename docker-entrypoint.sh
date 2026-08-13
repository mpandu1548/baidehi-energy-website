#!/bin/sh
set -eu

mkdir -p /app/data /app/media

# A mounted media volume starts empty. Seed it once so existing site images
# remain available while later editor uploads persist on that same volume.
if [ ! -f /app/media/.initialized ]; then
  cp -a /app/media-seed/. /app/media/
  touch /app/media/.initialized
fi

exec "$@"
