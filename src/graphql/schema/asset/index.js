const { gql } = require('apollo-server');

const addAsset = require('./resolvers/addAsset');
const addAssetUrl = require('./resolvers/addAssetUrl');
const uploadAsset = require('./resolvers/uploadassets');
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
    scalar Upload

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

    input AssetInputUrl{
      path:String!
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

    type File {
      id: ID!
      path: String!
      filename: String!
      mimetype: String!
      encoding: String!
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
      addAssetUrl(data:AssetInputUrl):Asset! @auth(requires:USER)
      uploadAsset(file:Upload!): Asset! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

const { GraphQLUpload } = require('apollo-upload-server');

module.exports.resolvers = {
  Upload: GraphQLUpload,
  Query: {
    asset,
  },
  Mutation: {
    addAsset,
    uploadAsset,
    addAssetUrl
  },
};
