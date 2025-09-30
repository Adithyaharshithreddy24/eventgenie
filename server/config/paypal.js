const paypal = require('@paypal/paypal-server-sdk');

// PayPal configuration
const client = new paypal.Client({
    environment: paypal.Environment.Sandbox,
    clientId: 'AfrJqA9lu6MHtb6m4x2BFbEKn6mIYo3NFYRFWDQCdsM34D5V8cxqSFoo7dEDrhxBuAoh4_RTu_KUCUlv',
    clientSecret: 'EMlseqq0uo3Ln8GIpZOWVMl59yhGE0Bcj5V56Ec8HfQ-eX3lAL8IYY40asb0mo8fK2f5u6kKrsb3ypfh'
});

module.exports = {
    client,
    environment: paypal.Environment.Sandbox
};
