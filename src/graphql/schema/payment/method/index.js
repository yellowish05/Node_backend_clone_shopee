const path = require('path');
const { gql } = require('apollo-server');
const { UserInputError, ApolloError } = require('apollo-server');

const paymentBundle = require(path.resolve('src/bundles/payment'));

const schema = gql`
    enum PaymentProvider { ${Object.keys(paymentBundle.providers).join(' ')} }

    ${Object.keys(paymentBundle.providers)
    .map((name) => paymentBundle.providers[name].getGQLSchema())
    .join('\n')}

    """ Payment Method (eWallet or credit cart) related with user"""
    type PaymentMethod {
        id: ID!
        provider: PaymentProvider!
        providerIdentity: String!
        name: String!
        """ Date when this method will be inactive"""
        expiredAt: Date!
    }

    input PaymentMethodExpiresInput {
        year: Int!
        month: Int!
    }

    input PaymentMethodInput {
        ${Object.keys(paymentBundle.providers).map((name) => `${name}: ${paymentBundle.providers[name].getGQLInputName()}`).join(', ')}
    }

    extend type Query {
        """Allows: authorized user"""
        paymentMethods: [PaymentMethod]!  @auth(requires: USER)
        availablePaymentMethods: [PaymentProvider]!
    }

    extend type Mutation {
        """Allows: authorized user"""
        addPaymentMethod(data: PaymentMethodInput!): PaymentMethod!  @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    async availablePaymentMethods() {
      return Object.keys(paymentBundle.providers);
    },
    async paymentMethods(_, args, { dataSources: { repository }, user }) {
      return repository.paymentMethod.getActiveMethods(user);
    },
  },
  Mutation: {
    async addPaymentMethod(_, { data }, context) {
      const providers = Object.keys(data).filter((name) => data[name]);
      if (providers.length > 1) {
        throw new UserInputError('You can add only one provider in one moment');
      }
      const providerName = providers[0];
      const providerData = data[providerName];

      return paymentBundle.providers[providerName].addMethod(providerData, context);
    },
  },
  PaymentMethod: {
    provider: ({ provider }) => {
      const found = Object.keys(paymentBundle.providers)
        .filter((name) => paymentBundle.providers[name].getName() === provider);
      if (found.length === 0) {
        throw new ApolloError(`Wrong provider in DB ${provider}`);
      }
      return found[0];
    },
  },
};
