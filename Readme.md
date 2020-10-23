# How to do (local environment)

## Environment
1. add to `~/.profile` node env `export NODENV=development`

## Configure Docker

1. add bridge network `docker network create --driver bridge shoclef_bridge`

## Using migrations for DynamoDB

1. install `migrate-mongoose` globally `npm install -g migrate-mongoose`
2. run migrations `migrate up` (local use) or `npm run migrate-up` (this command use on the stage and prod servers)


