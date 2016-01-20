/*
var MongoClient = require("mongodb");
var async = require("async");
var _ = require("underscore");


var url = 'mongodb://54.68.67.60:27017/tempostorm';


MongoClient.connect(url, function(err, db) {
  if(err) {
    console.log("ERR");
    console.log(err);
    return;
  }

async.waterfall([
  function(seriesCallback) {
    var heroCollection = db.collection("hero");
    var stream = heroCollection.find({}).stream();
    var talentDict = {};
     stream.on('data', function(hero) {

       for(var key in hero.oldTalents) {
         var talent = hero.oldTalents[key];
         if(!talent.name)
          continue;

         if(talentDict[talent.name])
          continue;

          var talentDoc = {
            name : talent.name,
            description: talent.description,
            className: talent.className,
            orderNum: talent.orderNum
          };

          talentDict[talent.name] = talentDoc;
       }

     });

     stream.on('end', function() {
       console.log("stream ended");
       seriesCallback(undefined, talentDict);
     });

     stream.on('error', function (err) {
       console.log("stream error:", err);
       seriesCallback(err);
     });
  },
  function(talentDict, seriesCallback) {
    var talentArray = _.values(talentDict);
    var talentCollection = db.collection("talent");
    var addedTalentCount = 0;
    async.eachSeries(talentArray, function(talent, callback) {
       talentCollection.insert(talent, function(err) {
          if(err) console.log("Error entering talent");
          else console.log("added talent:", addedTalentCount++);
          callback(err);
       });
    }, seriesCallback);
  }],
 function(err) {
   if(err) console.log("added talent error: ", err);
   else console.log("Donnerino");

   if(db) {
     console.log("closing db");
     db.close();
   }
 });
});
*/
