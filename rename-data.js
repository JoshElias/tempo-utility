var MongoClient = require("mongodb");
var async = require("async");
var _ = require("underscore");
var migrationData = require("./migration.json");

var url = 'mongodb://52.11.14.8:27017,52.8.169.246:27017,54.174.103.94:27017,52.28.87.90:27017,54.79.121.240:27017/tempostorm';

MongoClient.connect(url, function(err, db) {
  if(err) {
    console.log("ERR");
    console.log(err);
    return;
  }

  async.forEachOfSeries(migrationData, function(value, key, eachCallback) {

    var oldCollectionName = migrationData[key].oldCollectionName;
    db.renameCollection(oldCollectionName, key, function(err, newCollection) {
      if(err) eachCallback(err);
      else if(!value.propertyNames) eachCallback();
      else {
        newCollection.update({}, {$rename:value.propertyNames}, {multi:true}, function(err) {
          if(err) console.log("err renaming propertyNames:", value.propertyNames);
          eachCallback(err);
        });
      }
    });
  }, function(err) {
    if(err) console.log("ERR renaming properties", err);
    else console.log("Donnerino");
  });
});
