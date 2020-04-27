const auth = require('../middleware/auth.js');
var multer = require('multer');
var mime = require('mime-types');
var config = require('../../config/app.config.js');
var profileConfig = config.users;

var storage = multer.diskStorage({
    destination: profileConfig.imageUploadPath,
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + "." + mime.extension(file.mimetype))
    }
});
var userImageUpload = multer({ storage: storage });
module.exports = (app) => {
    const accounts = require('../controllers/accounts.controller.js');
    app.post('/accounts/sign-up', accounts.signUp);
    app.post('/accounts/login', accounts.login);
    app.get('/accounts/profile',auth, accounts.getProfile);
    app.patch('/accounts/update-profile',auth,userImageUpload.single('image'), accounts.updateProfile);
    app.post('/accounts/send-otp', accounts.sendSms);
    app.post('/accounts/verify-otp', accounts.verifyOtp);
    app.patch('/accounts/reset-password', accounts.resetPasssword);
    app.patch('/accounts/change-password',auth, accounts.changePasssword);
    app.post('/accounts/search',auth, accounts.fullSearch);
    app.get('/accounts/filter-options',auth, accounts.getFilterOptions);
};


