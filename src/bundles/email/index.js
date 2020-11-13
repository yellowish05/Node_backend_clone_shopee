const path = require('path');

const { VerificationEmailTemplate } = require(path.resolve('src/lib/Enums'));
const AbstractEmailService = require('./AbstractEmailService');

class EmailService extends AbstractEmailService {
    sendWelcome(data) {
        const template = this.getTemplate('WELCOME');

        const params = this.getParams({template, user: data.user});

        return this.send(params);
    }

    sendRecoverPasswordCode(data) {
        const template = this.getTemplate(VerificationEmailTemplate.RESET_PASSWORD);

        const params = this.getParams({template, user: data.user, code: data.code});

        return this.send(params);
    }

    sendPasswordChanged(data) {
        const template = this.getTemplate('PASSWORD_CHANGED');

        const params = this.getParams({template, user: data.user});

        return this.send(params);
    }
}

module.exports.EmailService = new EmailService();
