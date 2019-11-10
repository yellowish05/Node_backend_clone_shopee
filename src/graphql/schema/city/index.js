const { gql } = require('apollo-server');
const { cdn } = require('../../../../config');

const schema = gql`

    type City {
        id: ID!
        name: String!
        location: LatLng!
        photo: String!
    }

    input CityInput {
        name: String!
    }

    extend type Query {
        city(name: String!): City!
        cities: [City]!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    city(_, { name }, { dataSources: { repository } }) {
      return repository.city.findByName(name);
    },
    cities(_, args, { dataSources: { repository } }) {
      return repository.city.getAll();
    },
  },
  City: {
    photo(city) {
      return cdn.appAssets + city.photo;
    },
  },
};
