const path = require('path');

const { gql } = require('apollo-server');

const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const addProduct = require('./resolvers/addProduct');
const updateProduct = require('./resolvers/updateProduct');
const deleteProduct = require('./resolvers/deleteProduct');
const setProductThumbnail = require('./resolvers/setProductThumbnail');
const products = require('./resolvers/products');
const uploadBulkProducts = require('./resolvers/uploadBulkProducts');
const previewBulkProducts = require('./resolvers/previewBulkProducts');
const addProductAttr = require('./resolvers/addProductAttr');
const productAttributes = require('./resolvers/productAttributes');
const updateProductAttr = require('./resolvers/updateProductAttr');
const deleteProductAttr = require('./resolvers/deleteProductAttr');

const schema = gql`
    type ProductAttribute {
      id: ID!
      productId: ID!
      color: String!
      size: String!
      price(currency: Currency): AmountOfMoney!
      oldPrice(currency: Currency): AmountOfMoney!
      quantity: Int!
      asset: Asset!
    }

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
        price(currency: Currency): AmountOfMoney!
        """
            Price in cents. Use the Currency for show it in correct format
        """
        oldPrice(currency: Currency): AmountOfMoney
        quantity: Int!
        assets: [Asset!]!
        thumbnail: Asset
        attrs: [ProductAttribute]
        category: ProductCategory!
        # weight: Weight!
        shippingBox: ShippingBox!
        brand: Brand!
        relatedLiveStreams(limit: Int = 1): [LiveStream]!
        freeDeliveryTo: [MarketType!]
        rating: Float!
        customCarrier: CustomCarrier
        customCarrierValue(currency: Currency):AmountOfMoney
    }

    type failedProducts{
      row: [Int!]
      errors: [String!]
    }

    type UploadedProducts{
      success: [Product]
      failedProducts: failedProducts!
      totalProducts: Int!
      uploaded: Int!
      failed: Int!
    }

    type Weight {
      value: Float!
      unit: WeightUnitSystem!
    }

    input WeightInput {
      value: Float!
      unit: WeightUnitSystem!
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
        """This price in currency (like 23.45)"""
        price: AmountOfMoneyRangeInput
        """
            You can use it for fetch products by specific Seller
        """
        sellers: [ID!]
    }

    input ProductAttributeInput {
      productId: ID!
      quantity: Int!
      price: Float!
      discountPrice: Float
      currency: Currency!
      color: String!
      size: String!
      asset: ID!
    }

    input UpdateProductAttributeInput {
      productId: ID!
      quantity: Int
      price: Float
      discountPrice: Float
      currency: Currency
      color: String
      size: String
      asset: ID
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
            page: PageInput = {}
        ): ProductCollection!
        product(id: ID!): Product
        previewBulkProducts(fileName:String!): String! @auth(requires: USER)
        productAttributes(productId: ID!): [ProductAttribute!]!
    }

    input ProductInput {
        title: String!
        description: String!
        """
            Price in dollars. Use the Currency for convert user input in cents
        """
        price: Float!
        """
            Price in dollars. Use the Currency for convert user input in cents
        """
        discountPrice: Float
        quantity: Int!
        """
            The Active User Currency
        """
        currency: Currency!
        assets: [ID!]!
        category: ID!
        # weight: WeightInput!
        shippingBox: ID!
        brand: ID!
        freeDeliveryTo: [MarketType!]
        customCarrier: String
        customCarrierValue: Float
        thumbnailId:  ID!
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
        """
            Allows: authorized user
        """
        addProductAttr(data: ProductAttributeInput!): ProductAttribute! @auth(requires: USER)
        updateProductAttr(id: ID!, data: UpdateProductAttributeInput!): ProductAttribute! @auth(requires: USER)
        deleteProductAttr(id: ID!, productId: ID!): Boolean @auth(requires: USER)
        setProductThumbnail(id: ID!, assetId: ID!): Boolean!
        uploadBulkProducts(fileName:String!, bucket:String): UploadedProducts!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    products,
    product: async (_, { id }, { dataSources: { repository } }) => repository.product.getById(id),
    previewBulkProducts,
    productAttributes,
  },
  Mutation: {
    addProduct,
    updateProduct,
    deleteProduct,
    setProductThumbnail,
    uploadBulkProducts,
    addProductAttr,
    updateProductAttr,
    deleteProductAttr,
  },
  Product: {
    seller: async ({ seller }, _, { dataSources: { repository } }) => (
      repository.user.load(seller)
    ),
    assets: async ({ assets }, _, { dataSources: { repository } }) => (
      repository.asset.getByIds(assets)
    ),
    thumbnail: async ({ thumbnail: assetId }, _, { dataSources: { repository }}) => (
      repository.asset.getById(assetId)
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
    shippingBox: async ({ shippingBox }, _, { dataSources: { repository } }) => (
      repository.shippingBox.findOne(shippingBox)
    ),
    customCarrierValue: async ({ customCarrierValue, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: customCarrierValue, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney
    },
    price: async ({ price, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: price, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    oldPrice: async ({ oldPrice, currency }, args) => {
      if (!oldPrice) {
        return null;
      }

      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: oldPrice, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    relatedLiveStreams: async ({ id }, { limit }, { dataSources: { repository } }) => repository.liveStream.get({
      filter: {
        experiences: [],
        categories: [],
        cities: [],
        statuses: [],
        streamers: [],
        product: id,
      },
      page: { limit, skip: 0 },
      sort: { feature: 'CREATED_AT', type: 'DESC' },
    }),
    rating: async (product, _, { dataSources: { repository } }) => repository.rating.getAverage(product.getTagName()),
    customCarrier: async ({ customCarrier }, _, { dataSources: { repository } }) => repository.customCarrier.getById(customCarrier),
    // attributes of product
    attrs: async ({ attrs }, _, { dataSources: { repository }}) => {
      var attributes = await repository.productAttributes.getByIds(attrs);
      await Promise.all( attributes.map(async (attr, index) => {
        attributes[index].asset = await repository.asset.getById(attr.asset);
      }));
      return attributes;
    }
  },
  ProductAttribute: {
    asset: async ({ asset }, _, { dataSources: { repository } }) => (
      repository.asset.getById(asset)
    ),
    price: async ({ price, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: price, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    oldPrice: async ({ oldPrice, currency, price }, args) => {
      if (!oldPrice) {
        oldPrice = price;
      }
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: oldPrice, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },

  },
};
