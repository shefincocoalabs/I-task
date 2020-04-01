const mongoose = require('mongoose');


const OtpSchema = mongoose.Schema({
    phone : String, 
    isUsed : Boolean,
    userToken : String,
    apiToken : String,
    expiry : Number,
    tsCreatedAt : Number,
    tsModifiedAt : Number
})

module.exports = mongoose.model('Otp', OtpSchema, 'Otps');