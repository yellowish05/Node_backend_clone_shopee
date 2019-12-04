const path = require('path');

const header = require(path.resolve('src/view/header.email'));
const layout = require(path.resolve('src/view/simple.layout.email'));
const footer = require(path.resolve('src/view/footer.email'));

module.exports = {
  subject: 'Sign up email',
  build({ code, ...args }) {
      return layout(
            header({title: 'Welcome!', description: 'You\'ve just signed up for the most fun and hassle-free way to shop.'}) + `
            <tr class="body sign-up">
                <td>
                    <h5>Five Reasons</h5>
                    <p>we know you'll love us!</p>
                    <p>
                        Hi ${args.name || ''}, <br>
                        Thank you for signing up with Shoclef. We have lots of wonderful products, services, features, and deals for you. Here are our five main features that you can enjoy:
                    </p>
                    <p>
                        LIVE SHOPPING <br>
                        Experience the joy of shopping from the convenience of your home. Easily swipe to browse hundreds of livestreams filled with your favorite products.
                    </p>
                    <p>
                        WORLDWIDE ACCESS <br>
                        Shop millions of products from different cities within minutes – from London, Paris, Mumbai to Los Angeles.
                    </p>
                    <p>
                        LIVE EXPERIENCES <br>
                        Tailor your livestream experience to fit your needs and interests, with a focus on making shopping fun again!
                    </p>
                    <p>
                        CHAT & BUY <br>
                        Loved a product? See what others are saying in the chatroom or directly chat with the seller before making a purchase.
                    </p>
                    <p>
                        SHOP ON THE GO <br>
                        Shop wherever you are, whenever you want on our awesome app for IOS & Android.
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
