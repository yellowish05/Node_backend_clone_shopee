/* eslint-disable no-param-reassign */
const path = require('path');
const { gql } = require('apollo-server');

const generateDiscountCode = require('./resolvers/generateDiscountCode');

const { DiscountValueType, DiscountPrivileges } = require(path.resolve('src/lib/Enums'));

const schema = gql`
    enum DiscountValueType {
      ${DiscountValueType.toGQL()}
    }
    enum DiscountPrivileges {
      ${DiscountPrivileges.toGQL()}
    }
    type Discount {
      user: User!
      code: String
      value_type: DiscountValueType!
      products:[Product]
      product_categories:ProductCategory
      all_product:Boolean
      brands:[Brand]
      brand_categoryies:BrandCategory
      amount: Int!
      privilege: DiscountPrivilege
      startAt:Date
      endAt:Date
      isActive:Boolean
    }

    

    extend type Query {
        """
            Allows: authorized user
        """
    }

    extend type Mutation {
        """
            Allows: authorized user
        """
        generateDiscountCode(
            value_type: DiscountValueType!
            products:[Product]
            product_categories:ProductCategory
            all_product:Boolean
            brands:[Brand]
            brand_categoryies:BrandCategory
            amount: Int!
            privilege: DiscountPrivilege
            startAt:Date!
            endAt:Date!
        ) : Discount! @auth(requires: USER)
        
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
    Query: {
        
    },
    Mutation: {
        generateDiscountCode
    }
};
