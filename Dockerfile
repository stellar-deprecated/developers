FROM ubuntu:20.04 as build

MAINTAINER SDF Ops Team <ops@stellar.org>

ADD . /app/src

WORKDIR /app/src

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install --no-install-recommends -y gpg curl git make ca-certificates gcc g++ apt-transport-https && \
    curl -sSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key|gpg --dearmor >/etc/apt/trusted.gpg.d/nodesource.gpg && \
    echo "deb https://deb.nodesource.com/node_10.x focal main" | tee /etc/apt/sources.list.d/nodesource.list && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg |gpg --dearmor >/etc/apt/trusted.gpg.d/yarnpkg.gpg && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y nodejs yarn


RUN npm install -q -g gulp && yarn install && rm -rf ./repos/ && \
    gulp --pathPrefix="/developers"

FROM nginx:1.17

COPY --from=build /app/src/build/ /usr/share/nginx/html/developers
