const { gql } = require("apollo-server");
const path = require("path");

const { BannerAdType, BannerLayoutType, BannerType } = require(path.resolve("src/lib/Enums"));

const banner = require("./resolvers/banner");
const banners = require("./resolvers/banners");
const addBanner = require("./resolvers/addBanner");
const updateBanner = require('./resolvers/updateBanner');

const schema = gql`

    enum BannerAdType {
      ${BannerAdType.toGQL()}
    }

    enum BannerLayoutType {
      ${BannerLayoutType.toGQL()}
    }

    enum BannerType {
      ${BannerType.toGQL()}
    }

    enum BannerSortFeature {
      CREATED_AT
      NAME
    }

    type BannerSize {
      width: Int!
      height: Int!
    }

    input BannerSizeInput {
      width: Int!
      height: Int!
    }

    type Banner {
      id: ID!
      """
        Unique name for each banner.
      """
      name: String!
      """
        Path in site routing.
      """
      page: String
      sitePath: String!
      """
        Array of banner media as type of "Asset". Matches with urls by array index.
      """
      assets: [Asset!]
      """
        Array of redirecting link urls. Matches with assets by array index.
      """
      urls: [String!]
      adType: BannerAdType!
      type: BannerType!
      layout: BannerLayoutType!
      """
        Dimensions of asset or layout.
      """
      size: BannerSize
      """
        Interval for layouts of "carousel","floating", "rotating". unit in seconds
      """
      time: Int
    }

    input BannerInput{
      name: String!
      page: String
      sitePath: String!
      assets: [ID!]
      urls: [String]
      adType: BannerAdType!
      type: BannerType!
      layout: BannerLayoutType!
      size: BannerSizeInput!
      time: Int
    }

    input BannerUpdateInput {
      name: String
      page: String
      sitePath: String
      assets: [ID!]
      urls: [String]
      adType: BannerAdType
      type: BannerType
      layout: BannerLayoutType
      size: BannerSizeInput
      time: Int
    }

    type BannerCollection {
        collection: [Banner]!
        pager: Pager
    }

    input BannerFilterInput {
      searchQuery: String
      sitePath: String
      type: BannerType
      adType: BannerAdType
      layout: BannerLayoutType
    }

    input BannerSortInput {
      feature: BannerSortFeature! = CREATED_AT
      type: SortTypeEnum! = ASC
    }

    extend type Query {
      banner(id: ID!): Banner!
      banners(
        filter: BannerFilterInput, 
        sort: BannerSortInput, 
        page: PageInput = {}): BannerCollection! @auth(requires: USER)
    }

    extend type Mutation {
      addBanner (data: BannerInput!): Banner! @auth(requires: USER)
      updateBanner(id: ID!, data: BannerUpdateInput!): Banner! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    banner,
    banners,
  },
  Mutation: {
    addBanner,
    updateBanner,
  },
  Banner: {
    assets: async ({ assets: assetIds }, _, { dataSources: { repository } }) => {
      if (!assetIds || !assetIds.length) return [];
      return repository.asset.getByIds(assetIds);
    }
  }
};
