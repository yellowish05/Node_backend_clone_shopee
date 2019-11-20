/* eslint-disable no-param-reassign */
const path = require('path');
const { gql } = require('apollo-server');
const faker = require('faker');

const { MetricSystem } = require(path.resolve('src/lib/Enums'));
const logger = require(path.resolve('config/logger'));

const mutation = gql`
  mutation addShippingBox($label: String!, $width: Float!, $height: Float!, $length: Float!, $system: MetricSystemEnum!) {
    addShippingBox(data: {
        label: $label,
        width: $width,
        height: $height,
        length: $length,
        system: $system,
    }) {
        id
        label
        width
        height
        length
        system
    }
  }
`;

const shippingBoxesData = [
  {
    email: 'bob@domain.com',
    label: faker.random.word(),
    width: faker.random.number(100),
    height: faker.random.number(100),
    length: faker.random.number(100),
    system: MetricSystem.USC,
  },
  {
    email: 'bill@domain.com',
    label: faker.random.word(),
    width: faker.random.number(100),
    height: faker.random.number(100),
    length: faker.random.number(100),
    system: MetricSystem.USC,
  },
  {
    email: 'john@domain.com',
    label: faker.random.word(),
    width: faker.random.number(100),
    height: faker.random.number(100),
    length: faker.random.number(100),
    system: MetricSystem.SI,
  },
  {
    email: 'esrael@domain.com',
    label: faker.random.word(),
    width: faker.random.number(100),
    height: faker.random.number(100),
    length: faker.random.number(100),
    system: MetricSystem.SI,
  },
];

module.exports.data = { shippingBoxes: shippingBoxesData };

module.exports.handler = async (client, context) => {
  logger.info('[fixture] Shipping Box execution!');
  context.shippingBoxes = [];
  return Promise.all(shippingBoxesData.map((variables) => {
    const user = context.users[variables.email];

    return client
      .mutate({
        mutation,
        variables: {
          ...variables,
        },
        context: {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        },
      }).then(({ data: { addShippingBox } }) => {
        context.shippingBoxes.push(addShippingBox);
      });
  }));
};
