const superagent = require('superagent');
var config = require('../../config/app.config.js');
var gatewayUrl = config.gateway.url; 
module.exports = {
    
    get: function(path,params,callback) {
        /**
         * 
        */
        var url = gatewayUrl + path;
        console.log("Routing path "+url +" through gateway");
        superagent.get(url).query(params).end((err,res)=> { 
            callback(err,res.body);
        }); 
    },
    
    patch: function(path,params,callback) {
        /**
         * 
        */
       var url = gatewayUrl + path;
       console.log("Routing path "+url +" through gateway");
       superagent.patch(url).send(params).set('Accept', 'application/json').end((err,res)=> { 
           callback(err,res.body);
       }); 
    }
}
 