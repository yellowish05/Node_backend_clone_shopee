const { AuthenticationError, ForbiddenError } = require('apollo-server');

class AuthInjection {
  constructor(resolvers) {
    this.resolvers = resolvers;
  }

  resolverAuthFactory(resource, action, authResolver) {
    return async (root, args, context, info) => {
      if (authResolver.isSecure && context.user === null) {
        if (authResolver.errorBehavior) {
          return authResolver.errorBehavior(new AuthenticationError('You should be logged'));
        }
        return null;
      }

      if (authResolver.isSecure && !context.access.isGranted(info.parentType, info.fieldName)) {
        if (authResolver.errorBehavior) {
          return authResolver.errorBehavior(new ForbiddenError('Permission denied'));
        }
        return null;
      }

      const possession = context.access.getPossession(info.parentType, info.fieldName);
      if (
        possession !== 'any'
        && authResolver.isAllowedPossession
        && !await authResolver.isAllowedPossession(possession, root, args, context)
      ) {
        if (authResolver.errorBehavior) {
          return authResolver.errorBehavior(new ForbiddenError('Permission denied'));
        }

        return null;
      }

      return authResolver.resolver(root, args, context, info);
    };
  }

  addAuthResolvers(typeName, actions) {
    Object.keys(actions).forEach((actionName) => {
      if (typeof actions[actionName] === 'function') {
        return null;
      }
      actions[actionName] = this.resolverAuthFactory(typeName, actionName, actions[actionName]);
    });

    return actions;
  }

  buildApolloResolvers() {
    const result = [];
    this.resolvers.forEach((resolver) => {
      Object.keys(resolver).forEach((typeName) => {
        const actions = {};
        actions[typeName] = this.addAuthResolvers(typeName, resolver[typeName]);
        result.push(actions);
      });
    });

    return result;
  }
}

module.exports.AuthInjection = AuthInjection;
