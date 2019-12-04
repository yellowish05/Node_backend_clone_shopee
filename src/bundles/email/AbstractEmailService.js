
const path = require('path');

const { ApolloError } = require('apollo-server');
const logger = require(path.resolve('config/logger'));
const EmailProvider = require(path.resolve('config/emailProvider'));
const requireDir = require('require-dir');
const { email } = require(path.resolve('config'));
const templates = requireDir('./view');

class AbstractEmailService {
    getTemplate(name) {
        const template = templates[name];

        if (!template) {
            throw new ApolloError('Template does not exists', 400, { invalidArgs: 'template' });
        }

        return template;
    }

    getParams(args) {
        const params = {
            subject: args.template.subject,
            to: args.user.email,
            from: email.from,
            body: args.template.build({ code: args.code, user: args.user }),
            bodyType: email.bodyType,
        };

        return params;
    }

    send(params) {
        logger.debug(`[EMAIL] try send email ${JSON.stringify(params)}`);
        return EmailProvider.Email.Send(params);
    }
}

module.exports = AbstractEmailService;
