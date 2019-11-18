const { gql } = require('apollo-server');

const addProduct = require('./resolvers/addProduct');
const updateProduct = require('./resolvers/updateProduct');
const deleteProduct = require('./resolvers/deleteProduct');
const products = require('./resolvers/products');

const schema = gql`
    type Product {
        id: ID!
        """
            The User who is product owner
        """
        seller: User!
        title: String!
        description: String!
        """
            Price in cents. Use the Currency for show it in correct format
        """
        price: Int!
        """
            Price in cents. Use the Currency for show it in correct format
        """
        oldPrice: Int
        quantity: Int!
        currency: CURRENCY!
        assets: [Asset!]!
        category: ProductCategory!
        brand: Brand!
    }

    type ProductCollection {
        collection: [Product]!
        pager: Pager
    }

    input ProductFilterInput {
        """
            Searching by Title and Description of the Product.
            Will return products if the query full matched inside title or description
        """
        searchQuery: String
        # todo need implement filtering by quantity
        # quantity: IntRangeInput = {min: 1}
        categories: [ID!]
        brands: [ID!]
        price: IntRangeInput
        """
            You can use it for fetch products by specific Seller
        """
        sellers: [ID!]
    }

    enum ProductSortFeature {
      CREATED_AT
      PRICE
    }

    input ProductSortInput {
      feature: ProductSortFeature! = CREATED_AT
      type: SortTypeEnum! = ASC
    }

    extend type Query {
        products(
            filter: ProductFilterInput = {},
            sort: ProductSortInput = {},
            page: PageInput = {},
            """
                The Currency in which do you want to see price.
                Usually, this is the user active currency
            """
            currency: CURRENCY
        ): ProductCollection!

        product(id: ID!): Product
    }

    input ProductInput {
        title: String!
        description: String!
        """
            Price in cents. Use the Currency for convert user input in cents
        """
        price: Int!
        """
            Price in cents. Use the Currency for convert user input in cents
        """
        discountPrice: Int
        quantity: Int!
        """
            The Active User Currency
        """
        currency: CURRENCY!
        assets: [ID!]!
        category: ID!
        brand: ID!
    }

    extend type Mutation {
        """
            Allows: authorized user
        """
        addProduct(data: ProductInput!): Product! @auth(requires: USER)
        """
            Allows: authorized user & user must be a seller of this product
        """
        updateProduct(id: ID!, data: ProductInput!): Product! @auth(requires: USER)
        """
            Allows: authorized user & user must be a seller of this product
        """
        deleteProduct(id: ID!): Boolean @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    products,
    product: async (_, { id }, { dataSources: { repository } }) => repository.product.getById(id),
  },
  Mutation: {
    addProduct,
    updateProduct,
    deleteProduct,
  },
  Product: {
    seller: async ({ seller }, _, { dataSources: { repository } }) => (
      repository.user.load(seller)
    ),
    assets: async ({ assets }, _, { dataSources: { repository } }) => (
      repository.asset.getByIds(assets)
    ),
    category: async ({ category }, _, { dataSources: { repository } }) => (
      repository.productCategory.getById(category)
    ),
    brand: async ({ brand }, _, { dataSources: { repository } }) => (
      repository.brand.getById(brand)
    ),
    quantity: async ({ id }, _, { dataSources: { repository } }) => (
      repository.productInventoryLog.getQuantityByProductId(id)
    ),
  },
};
