const path = require('path');

const { email } = require(path.resolve('config'));

const header = require(path.resolve('src/view/header.email'));
const layout = require(path.resolve('src/view/simple.layout.email'));
const footer = require(path.resolve('src/view/footer.email'));

module.exports = {
  subject: 'Password has been changed',
  build({ code, ...args }) {
    return layout(
        header({title: 'Update!', description: 'Your password has been changed.'}) + `
        <tr class="body password-changed">
            <td>
                <p class="title-color">
                    Hi${args.user.name ?  ' ' + args.user.name: ''},
                </p>
                <p>
                    The password for the Shoclef account <a class="link link-default" href="#">${args.user.email}</a> was just changed.
                </p>
                <p>
                    If this was you, then you can safely ignore this email.
                </p>
                <p>
                    If this wasn’t you, 
                    <a class="link" href="mailto:${email.supportEmail}">contact our support</a>.
                </p>
                <p>
                    Cheers, <br>  
                    Shoclef Corporation!
                </p>
            </td>
        </tr>
    ` + footer(), args);
  },
};
