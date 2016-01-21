var MongoClient = require("mongodb");
var async = require("async");
var _ = require("underscore");

var url = 'mongodb://52.11.14.8:27017,52.8.169.246:27017,54.174.103.94:27017,52.28.87.90:27017,54.79.121.240:27017/tempostorm';

MongoClient.connect(url, function(err, db) {
  if(err) {
    console.log("ERR");
    console.log(err);
    return;
  }

  async.waterfall([

      function(seriesCb) {
          console.log('finding heroes');
          db.collection("hero").find({}).toArray(seriesCb);
      },
      function (heroes, seriesCb) {
          async.eachSeries(heroes, function (hero, heroCb) {
              var chars = hero.characters;
              var charNames = [];
              
              if (chars == 1) {
                  charNames.push(hero.characters[0].name);                  
              } else {
                  _.each(chars, function (char) {
                      charNames.push(char.name);
                  });
              }
              
              var dbAbil =  db.collection("ability");
              async.waterfall([
                  function (abilCb) {
                      console.log('finding abilities for', hero.name);
                      dbAbil.find({ heroId: hero._id }).toArray(abilCb);
                  },
                  function (abilities, abilCb) {
                      async.eachSeries(abilities, function (ability, eachCb) {
                          if(_.isUndefined(ability.charNames))
                              ability.charNames = [];
                          
                          ability.charNames = charNames;
                          
                          return eachCb();
                      }, function () {
                          return abilCb(undefined, abilities);
                      });
                  },
                  function (abilities, abilCb) {
                      async.eachSeries(abilities, function (ability, eachCb) {
                          console.log('writing ability for', hero.name);
                          
                          dbAbil.update({ _id: ability._id }, ability, eachCb);
                      }, abilCb);
                  }
              ], heroCb);
          });
      }
  ], function (err) {
      if(err) { console.log("ERR:", err); }
      
      console.log("done");
  });
});