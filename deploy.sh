#!/bin/bash
# Deploy koemori.ai to Netlify
TOKEN=$(~/.openclaw/secrets/koemori-secret.sh get netlify-token 2>/dev/null)
cd "$(dirname "$0")"
node_modules/.bin/vite build && \
NETLIFY_AUTH_TOKEN=$TOKEN npx netlify-cli@latest deploy --dir=dist --site=ee501ad3-983e-4ce1-aedc-a1e72397e47c --prod
