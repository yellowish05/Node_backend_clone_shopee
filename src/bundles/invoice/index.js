const path = require('path');
const repository = require(path.resolve('src/repository'));
const { payment } = require(path.resolve('config'));
const stripe = require("stripe")(payment.providers.stripe.secret);

const invoiceService = {
    async generateInvoicePDF(pid, cartItems) {
        const paymentIntent = await stripe.paymentIntents.retrieve(pid)
        console.log(paymentIntent)
        return paymentIntent
    }
}

module.exports = invoiceService
