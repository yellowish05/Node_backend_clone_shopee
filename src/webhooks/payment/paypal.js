const path = require('path');
const logger = require(path.resolve('config/logger'));
const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));
const repository = require(path.resolve('src/repository'));
const checkout = require(path.resolve('src/graphql/schema/commerce/purchaseOrder/checkoutMethods'));
const { payment } = require(path.resolve('config'));
const stripe = require("stripe")(payment.providers.stripe.secret);
const paypal = require('paypal-rest-sdk');

paypal.configure(payment.providers.paypal);


module.exports = async (req, res) => {
    let data, eventType;

    data = req.body.resource; console.log('[payment id]', data.id);
    eventType = req.body.event_type;

    if (eventType === "PAYMENTS.PAYMENT.CREATED") {
        const payId = data.id;
        const transaction = await repository.paymentTransaction.getByProviderTransactionId(payId);
        if (!transaction) return res.json({ status: false, message: "transaction not found!" });
        // const purchaseOrderId = transaction.tags[0].replace('PurchaseOrder:', '');
        transaction.processedAt = new Date();
        transaction.status = PaymentTransactionStatus.SUCCESS;
        await transaction.save();

        const execute_details = {
            payer_id: data.payer.payer_info.payer_id,
            transactions: data.transactions.map(tx => ({amount: tx.amount}))
        };
        paypal.payment.execute(payId, execute_details, async function (error, capture) {
            if (error) {
                console.error(error);
            } else {
                console.log('[Captured]', capture);
                // To-do: clear user carts
                // Funds have been captured
                // Fulfill any orders, e-mail receipts, etc
                // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
                
                // delete selected cart items.
                await repository.userCartItem.clear(transaction.buyer);
                return res.json({capture,transaction});
            }
        });
    } else if (eventType === "PAYMENT.SALE.COMPLETED") {
        res.sendStatus(200);
    } else {
        res.send('No matches in event type!');
    }
};
