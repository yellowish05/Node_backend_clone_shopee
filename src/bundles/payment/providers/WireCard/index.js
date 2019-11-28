/* eslint-disable class-methods-use-this */
const { gql } = require('apollo-server');

const ProviderAbstract = require('../ProviderAbstract');

class Provider extends ProviderAbstract {
  getName() {
    return 'WireCard';
  }

  getGQLSchema() {
    const input = `
        input ${this.getGQLInputName()} {
            name: String!
            cardnumber: String!
            expires: PaymentMethodExpiresInput!
            recurring: Boolean!
        }
    `;

    return input;
  }

  async addMethod({ name, expires, reccuring }, { dataSources, user }) {
    console.log(name, expires, reccuring);
  }
}

module.exports = new Provider();
