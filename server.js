const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// --- ENV VARIABLES ---
const MERCHANT_ID = process.env.MERCHANT_ID || 'ec463876';
const PUBLIC_KEY = process.env.PUBLIC_KEY || 'd6dfa3614697d955740c28fd56edcc03680e9e67';

// --- PAYMENT REQUEST ENDPOINT ---
app.post('/create-payment', (req, res) => {
    const { amount, tran_id, firstname, lastname, email, phone } = req.body;
    
    // ABA PayWay specific format: YYYYMMDDHHMMSS
    const req_time = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const type = 'purchase';
    const payment_option = 'abapay';

    // IMPORTANT: The order of these fields must match ABA's documentation exactly
    const rawString = 
        req_time + 
        MERCHANT_ID + 
        tran_id + 
        amount + 
        (firstname || '') + 
        (lastname || '') + 
        (email || '') + 
        (phone || '') + 
        type + 
        payment_option;

    const hash = crypto.createHmac('sha512', PUBLIC_KEY).update(rawString).digest('base64');

    res.json({
        req_time,
        merchant_id: MERCHANT_ID,
        tran_id,
        amount,
        hash,
        firstname,
        lastname,
        email,
        phone,
        type,
        payment_option
    });
});

// --- WEBHOOK / CALLBACK ENDPOINT ---
app.post('/webhook', (req, res) => {
    // PayWay sends a POST with a 'response' field (JSON string)
    // Note: In Production, you'd use your RSA Public Key to verify the signature header
    console.log("Payment Notification Received:", req.body);
    res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
