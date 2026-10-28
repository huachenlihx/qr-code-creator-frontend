#!/bin/sh
set -eu

# Next static export normally copies public assets. Explicitly copy the Apache
# dotfile because hidden-file handling can vary across tooling/deploy workflows.
if [ -d out ] && [ -f public/.htaccess ]; then
  cp public/.htaccess out/.htaccess
fi
