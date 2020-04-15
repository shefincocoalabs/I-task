const superagent = require('superagent');
var config = require('../../config/app.config.js');
var gatewayUrl = config.gateway.url; 
module.exports = {
    
    getWithAuth:  function (path, params,bearer,callback) {
        var url = gatewayUrl + path;
        console.log("Routing path " + url + " through gateway");
        superagent.get(url)
        .query(params)
        .set({'Content-Type': 'application/json', 'authorization':  bearer})
        .end((err,res)=> { 
            callback(err,res.text);
        }); 

    },
    
}
 