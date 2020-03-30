const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    image: String,
    phone: String,
    position: String,
    status: Number,
    tsCreatedAt: Number,
    tsModifiedAt: Number

});
module.exports = mongoose.model('User', UserSchema, 'Users');