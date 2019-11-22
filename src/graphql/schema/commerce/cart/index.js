const { gql } = require('apollo-server');

const addProductToCart = require('./resolvers/addProductToCart');
const deleteCartItem = require('./resolvers/deleteCartItem');
const updateCartItem = require('./resolvers/updateCartItem');

const schema = gql`
    type Cart {
      items: [CartItemInterface]!
    }

    type CartProductItem implements CartItemInterface {
      id: ID!
      quantity: Int!
      seller: User!

      product: Product!
    }

    interface CartItemInterface {
      id: ID!
      quantity: Int!
      seller: User!
    }

    extend type Query {
        """
            Allows: authorized user
        """
        cart: Cart! @auth(requires: USER)
    }

    extend type Mutation {
        """
            Allows: authorized user
        """
        addProductToCart(product: ID!, quantity: Int! = 1) : Cart! @auth(requires: USER)
        """
            Allows: authorized user
        """
        deleteCartItem(id: ID!) : Cart! @auth(requires: USER)
        """
            Allows: authorized user
        """
        updateCartItem(id: ID!, quantity: Int!) : Cart! @auth(requires: USER)
        """
            Allows: authorized user
        """
        clearCart : Cart! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    cart: async () => ({}),
  },
  Mutation: {
    addProductToCart,
    deleteCartItem,
    updateCartItem,
    clearCart: (obj, args, { dataSources: { repository }, user }) => repository.userCartItem.clear(user.id),
  },
  Cart: {
    items: async (_, args, { dataSources: { repository }, user }) => repository.userCartItem.getAll({ user: user.id }),
  },
  CartProductItem: {
    product: async (cartItem, _, { dataSources: { repository } }) => repository.product.getById(cartItem.product),
  },
  CartItemInterface: {
    __resolveType(cartItem) {
      if (cartItem.product) {
        return 'CartProductItem';
      }

      return null;
    },
  },
};
