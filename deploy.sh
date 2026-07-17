#!/bin/bash
# /opt/stacks/dreamlife/deploy.sh  (o donde clonaste el repo en el VPS)
set -e
cd "$(dirname "$0")"
git pull
docker compose build api web
docker compose up -d --no-deps api web
docker image prune -f
