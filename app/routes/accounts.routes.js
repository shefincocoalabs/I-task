module.exports = (app,methods,options) => {
    const accounts = methods.loadController('accounts',options);
    accounts.methods.post('/sign-up',accounts.signUp, {auth:false});
    accounts.methods.post('/login',accounts.login, {auth:false});
    accounts.methods.post('/update-profile',accounts.updateProfile, {auth:true});
    
}