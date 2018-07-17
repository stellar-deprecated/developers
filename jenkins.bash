#! /usr/bin/env bash
set -e

cat <<-EOS > build-node.bash
  set -e
  cd "\$(dirname "\$0")"
    
  rollback() {
    echo "rolling back"
    set +e
    rm -rf node_modules
    rm -rf build 
    rm -rf repos
    rm build-node.bash
  }

  trap rollback INT TERM EXIT ERR

  npm install -q -g gulp

  npm install -q 
  chown -R ${UID} ./node_modules

  rm -rf ./repos/
  gulp --pathPrefix="/developers"
  chown -R ${UID} ./build

  rm build-node.bash

  trap - INT TERM EXIT ERR
EOS

docker run \
  --rm \
  -v $(pwd):/app \
  node:4 /bin/bash /app/build-node.bash 


