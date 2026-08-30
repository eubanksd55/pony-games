#!/bin/sh
git add -A && git commit -m "${1:-Update Pony Letters}" && git push
