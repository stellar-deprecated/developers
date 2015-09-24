#! /usr/bin/env bash
set -x

# switch to jenkins user inside docker container
useradd --uid ${JENKINS_UID:?"No JENKINS_UID set"} jenkins
sudo -u jenkins bash << EOF

time npm install --production

time rm -rf ./repos/
time ./node_modules/.bin/gulp --pathPrefix="/developers"

EOF

