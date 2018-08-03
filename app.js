var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/';

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // to support URL-encoded bodies

console.log("setting paths..");

app.route('/log').post(function(req, res) {
  var secret_key = req.body.secret_key;
  try {
    var contents = JSON.parse(req.body.contents);
  }
  catch(exception) {
    console.log(req.body.contents);
    console.log("contents must be valid json");
    res.send("contents must be valid json");
    return;
  }
  // Find the asset with the secret key
   MongoClient.connect(url, {useNewUrlParser : true}, function(err, db) {
       var dbo = db.db("fwo");
       var assetsCollection = dbo.collection('assets');

       assetsCollection.findOne({"secret_key" : secret_key}, function(err, result) {
           if (err) throw err;
           if (result == null) {
             res.send("invalid key");
             db.close();
             return;
           }

           var asset_id = result.asset_id;
           // Found the asset_id for the given secret_key
           // TODO: Check that timestamp, data and events are there
           var logCollections = dbo.collection('logs');

           // Create the new log document
           var logObject = {"asset_id" : asset_id,
                            "timestamp" : contents.timestamp, "data" : contents.data,
                          "events" : contents.events};
          logCollections.insertOne(logObject, function(err, response) {
          if (err) throw err;
          console.log("new log added.")
          res.send("added");
          db.close();
          });
       });
   });
});

// TODO: add dashboard
// TODO: add asset?asset_id page

var str = "";
app.route('/list').get(function(req, res) {
   console.log("generating list...");
   MongoClient.connect(url, {useNewUrlParser : true}, function(err, db) {
       var dbo = db.db("fwo");
       var collection = dbo.collection('logs');
       var cursor = collection.find({});
       str = "";
       cursor.forEach(function(item) {
           if (item != null) {
                   str = str + "data: " + JSON.stringify(item) + "</br>";
           }
       }, function(err) {
           res.send(str);
           db.close();
          }
       );
   });
});

// Run server
var server = app.listen(3000, function() {});
console.log("server started");
