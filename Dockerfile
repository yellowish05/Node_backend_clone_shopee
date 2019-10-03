  
FROM node:8.16-alpine

WORKDIR /home/node/app

# Install deps for production only
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

# Install deps for production only
COPY ./package* ./
RUN npm install --only=production && \
    npm cache clean --force

COPY ./src ./src
COPY ./server.js ./server.js

EXPOSE 4000