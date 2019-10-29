/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */

const Promise = require('bluebird');
const client = require('../config/graphqlTestClient')();
const { env } = require('../config');
const fixtureFiles = require('../fixtures.json');

if (env !== 'development' && env !== 'test') {
  throw new Error('Fixtures can be run only in development and test environments!');
}

// List of fixtures to execute
const fixtures = fixtureFiles.map((file) => require(`../${file}`));

const context = {};

const fixtureData = fixtures.reduce((mergedData, { data = {} }) => Object.assign(mergedData, data), {});

Promise.each(
  fixtures,
  (fixture) => fixture.handler(client, context, fixtureData),
  { concurrency: 1 },
)
  .then(() => {
    console.log(context);
  });
