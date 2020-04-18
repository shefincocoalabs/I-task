module.exports = (app,methods,options) => {
    const sample = methods.loadController('sample',options);
    sample.methods.post('/upload',sample.sampleUpload, {auth:false,multer: sample.getMulter});
}