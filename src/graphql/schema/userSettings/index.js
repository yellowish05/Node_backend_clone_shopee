const path = require('path');
const { gql } = require('apollo-server');

const { MeasureSystem, PushNotification } = require(path.resolve('src/lib/Enums'));

const updateUserSettings = require('./resolvers/updateUserSettings');

const schema = gql`
enum PushNotification {
    ${PushNotification.toGQL()}
}

enum MeasureSystem {
    ${MeasureSystem.toGQL()}
}

type UserSettings {
    pushNotifications: [PushNotification]!
    language: Locale!
    currency: Currency!
    measureSystem: MeasureSystem!
}
    
input UserSettingsInput {
    pushNotifications: [PushNotification]! = []
    language: Locale!
    currency: Currency!
    measureSystem: MeasureSystem!
}
  
extend type Query {
  """Allows: authorized user"""
  userSettings: UserSettings! @auth(requires: USER) 
}
  
extend type Mutation {
    updateUserSettings (data: UserSettingsInput!): UserSettings! @auth(requires: USER)
}
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    userSettings: async (obj, args, { user }) => user.settings,
  },
  Mutation: {
    updateUserSettings,
  },
};
