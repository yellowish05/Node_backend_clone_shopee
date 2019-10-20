const grantList = require('../graphql/schema/permissions');

class AccessControl {
  constructor(roles) {
    this.roles = roles;
    this.userPermissions = this.buildUserPermissions();
  }

  buildUserPermissions() {
    const result = {};
    grantList.forEach((item) => {
      if (this.roles.includes(item.role)) {
        result[`${item.resource}.${item.action}`] = {
          possession: item.possession,
        };
      }
    });

    return result;
  }

  isGranted(resource, action) {
    return `${resource}.${action}` in this.userPermissions;
  }

  getPossession(resource, action) {
    if (this.userPermissions[`${resource}.${action}`]) {
      return this.userPermissions[`${resource}.${action}`].possession || 'any';
    }

    return 'any';
  }
}

module.exports = AccessControl;
