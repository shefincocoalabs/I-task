module.exports = (app,methods,options) => {
    const accounts = methods.loadController('accounts',options);
    accounts.methods.get('/sign-up',accounts.signUp, {auth:false});
    
}