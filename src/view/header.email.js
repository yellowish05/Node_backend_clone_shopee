const path = require('path');

const { cdn } = require(path.resolve('config'));

module.exports = (args) => `
    <tr class="pre-header">
        <td>
            <img src="${cdn.appAssets}/images/shoclef-logo.png" alt="Shoclef Logo">
        </td>
    </tr>
    <tr class="header">
        <td>
            <h1>${args.title}</h1>
            <p>${args.description}</p>
        </td>
    </tr>
`;
