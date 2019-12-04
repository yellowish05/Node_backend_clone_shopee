const path = require('path');

const { cdn } = require(path.resolve('config'));

module.exports = (args) => `
    <tr class="footer">
        <td>
            <p>download the app</p>
            <p class="socials">
                <a href="#">
                    <img src="${cdn.appAssets}/images/apple-store-icon.png">
                </a>
                <a href="#">
                    <img src="${cdn.appAssets}/images/google-play-icon.png">
                </a>
            </p>
            <p>Follow US ON</p>
            <p class="socials">
                <a href="https://www.facebook.com/shoclef/" target="_blank">
                    <img src="${cdn.appAssets}/images/facebook.png">
                </a>
                <a href="https://www.instagram.com/shoclef/?hl=en" target="_blank">
                    <img src="${cdn.appAssets}/images/instagram.png">
                </a>
                <a href="#">
                    <img src="${cdn.appAssets}/images/youtube.png">
                </a>
                <a href="https://twitter.com/shoclef?lang=en">
                    <img src="${cdn.appAssets}/images/twitter.png">
                </a>
                <a href="https://www.linkedin.com/company/shoclef/">
                    <img src="${cdn.appAssets}/images/linkedin.png">
                </a>
            </p>
            <p>shoclef corporation</p>
            <p class="rights">© All Rights Reserved. 2019. info@shoclefcorporation.com</p>
            <p class="rights">You are receiving this email because you have signed up with Shoclef app or website.</p>
        </td>
    </tr>
`;
