#! /usr/bin/env bash
set -x

time npm install --production

time rm -rf ./repos/
time ./node_modules/.bin/gulp --pathPrefix="/developers"
