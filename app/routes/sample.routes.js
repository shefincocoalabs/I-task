module.exports = (app,methods,options) => {
    const sample = methods.loadController('sample',options);
    sample.methods.get('/test',sample.test, {auth:false});
    
}