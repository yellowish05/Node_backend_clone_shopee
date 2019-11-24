const { gql } = require('apollo-server');

const addAsset = require('./resolvers/addAsset');
const asset = require('./resolvers/asset');

const schema = gql`
    enum AssetStatusEnum {
      UPLOADING
      UPLOADED
      FAILED
      CANCELED
    }

    """This type based on the MIME type of the file"""
    enum AssetTypeEnum {
      IMAGE
      VIDEO
      PDF
    }

    type Asset {
      id: ID!
      """The path in the Storage. Path defined from root of the Storage"""
      path: String!
      """Public CDN URL"""
      url: String!
      status: AssetStatusEnum!
      type: AssetTypeEnum!
      """Size of asset in bytes"""
      size: Int!
    }

    input AssetInput {
      """It should be a MIME type of the file"""
      mimetype: String!
      """Size of asset in bytes"""
      size: Int!
    }

    extend type Query {
      asset(id: ID!): Asset!
    }

    extend type Mutation {
      """
      Allows: authorized user
      Asset is a file. It can be an Image, Video or PDF file. So any file.
      When you need upload assets you should go through next steps:
      1. use this entrypoint and register the asset what you going to upload
      2. in the response you will get a 'path'. This path you should use for upload file on Storage
      3. (in background) when file will be uploaded the Storage informs the API about that automaticaly, and status will be changed
      """
      addAsset (data: AssetInput!): Asset! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    asset,
  },
  Mutation: {
    addAsset,
  },
};
