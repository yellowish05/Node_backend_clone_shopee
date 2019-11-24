const { gql } = require('apollo-server');

const schema = gql`
    enum PaymentProvider {
        WIRECARD
        RAZORPAY
    }

    """ Payment Method (eWallet or credit cart) related with user"""
    type PaymentMethod {
        id: ID!
        provider: PaymentProvider!
        name: String!
        """ Date when this method will be inactive"""
        expiresAt: Date!
        isRecurringAllow: Boolean!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {

};
