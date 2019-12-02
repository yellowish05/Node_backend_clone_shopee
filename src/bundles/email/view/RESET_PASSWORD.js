const path = require('path');

const { email } = require(path.resolve('config'));

const header = require(path.resolve('src/view/header.email'));
const layout = require(path.resolve('src/view/simple.layout.email'));
const footer = require(path.resolve('src/view/footer.email'));

module.exports = {
  subject: 'Reset password',
  build({ code, ...args }) {
    return layout(
        header({title: 'Notice!', description: 'You told us you forgot your password.'}) + `
        <tr class="body reset-password">
            <td>
                <p class="title-color">
                    Hi${args.user.name ?  ' ' + args.user.name: ''},
                </p>
                <p>
                    We received a request to reset your password for your Shoclef account: 
                    <a class="link link-default" href="#">${args.user.email}</a>. We’re here to help!
                </p>
                <p>
                    Simply click on the button to set a new password:
                </p>
                <p class="reset-action">
                    <a href="#${code}">RESET PASSWORD</a>
                </p>
                <p>
                    If you didn’t ask to change your password, 
                    <a class="link" href="mailto:${email.supportEmail}">contact our support</a>! 
                    Don’t worry, your password is still safe and you can delete this email.
                </p>
                <p>
                    Cheers, <br>  
                    Shoclef Corporation!
                </p>
                <p class="action">
                    If you’re having trouble with the button above, copy and paste the URL below into your web browser. ${code}
                </p>
            </td>
        </tr>
    ` + footer(), args);
  },
};
