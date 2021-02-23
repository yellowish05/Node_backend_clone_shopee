/* eslint-disable no-param-reassign */

const { defaultFieldResolver } = require('graphql');
const { SchemaDirectiveVisitor } = require('graphql-tools');
const { AuthenticationError, ForbiddenError } = require('apollo-server');

const { gql } = require('apollo-server');

const schema = gql`
    directive @auth(
        requires: Role = ADMIN,
    ) on OBJECT | FIELD_DEFINITION

    enum Role {
        ADMIN
        USER
    }
`;

module.exports.typeDefs = [schema];

class AuthDirective extends SchemaDirectiveVisitor {
  visitObject(type) {
    this.ensureFieldsWrapped(type);
    type._requiredAuthRole = this.args.requires;
  }

  visitFieldDefinition(field, details) {
    this.ensureFieldsWrapped(details.objectType);
    field._requiredAuthRole = this.args.requires;
  }


  // eslint-disable-next-line class-methods-use-this
  ensureFieldsWrapped(objectType) {
    // Mark the GraphQLObjectType object to avoid re-wrapping:
    if (objectType._authFieldsWrapped) return;
    objectType._authFieldsWrapped = true;

    const fields = objectType.getFields();

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      const { resolve = defaultFieldResolver } = field;

      field.resolve = async function (...args) {
        // Get the required Role from the field first, falling back
        // to the objectType if no Role is required by the field:
        const requiredRole = field._requiredAuthRole
            || objectType._requiredAuthRole;

        if (!requiredRole) {
          return resolve.apply(this, args);
        }

        const { user } = args[2];
        if (!user) {
          throw new AuthenticationError('UNAUTHENTICATED');
        }

        if (!user.roles.includes(requiredRole)) {
          throw new ForbiddenError('Administrator permission required!');
        }

        return resolve.apply(this, args);
      };
    });
  }
}

module.exports.auth = AuthDirective;
