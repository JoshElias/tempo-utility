var MongoClient = require("mongodb");
var ObjectID = require("mongodb").ObjectID;
var async = require("async");
var _ = require("underscore");
var async = require("async");

var url = 'mongodb://localhost/tempostorm';

MongoClient.connect(url, function(err, db) {
    
    
//    {
//        "authorId": {},
//        "articleId": {},
//        "guideId": {},
//        "deckId": {},
//        "snapshotId": {},
//        "commentId": {}
//    }
    
    if(err) {
        console.log("ERR");
        console.log(err);
        return;
    }
    var finalVotes = [];

    //main series for running over all objects with votes
    async.series([
        doMigration,
        finalize
    ], function () {
        if (err) {
            console.log("error, votes NOT saved!!!", err);
            return; 
        }
        
        console.log("votes saved successfully");
    });
    
    //run over all collections with bi-directional votes (up & down)
    function doMigration (cb) {
        var collections = [
            "deck",
            "guide",
            "comment",
            "article",
            "snapshot"
        ]
        
        async.eachSeries(collections, function (collection, eachCb) {
            console.log("finding " + collection + "s");
            
            db.collection(collection).find({}, { _id: 1, votes: 1 }).toArray(function (err, documents) {
                _.each(documents, function (document) {
                    var documentID = document._id;
                    var votes = document.votes;

                    _.each(votes, function (vote) {
                        if (vote === "[object Object]") {
                            console.log('FOUND [object Object] RETURNING');
                            return;
                        }
                        
                        var newVote = {};
                            newVote[collection + "Id"] = documentID;
                        
                        if (!_.isUndefined(vote.direction) &&
                            !_.isUndefined(vote.userID)) {
                            newVote["direction"] = vote.direction;
                            newVote["authorId"] = new ObjectID(vote.userID.toString());
                        } else {
                            newVote["direction"] = 1;
                            newVote["authorId"] = (typeof vote === "object") ? vote : new ObjectID(vote);
                        }
                        
                        finalVotes.push(newVote);
                    });
                });

                return eachCb(undefined);
            });
        }, cb);
            
    }
    
    function finalize (cb) {
        db.collection("vote").insert(finalVotes, function (err) {
            if (err)
                return cb(err);
            
            return cb(undefined);
        });
    }
//      function (heroes, seriesCb) {
//          async.eachSeries(heroes, function (hero, heroCb) {
//              var chars = hero.characters;
//              var charNames = [];
//              
//              if (chars == 1) {
//                  charNames.push(hero.characters[0].name);                  
//              } else {
//                  _.each(chars, function (char) {
//                      charNames.push(char.name);
//                  });
//              }
//              
//              var dbAbil =  db.collection("ability");
//              async.waterfall([
//                  function (abilCb) {
//                      console.log('finding abilities for', hero.name);
//                      dbAbil.find({ heroId: hero._id }).toArray(abilCb);
//                  },
//                  function (abilities, abilCb) {
//                      async.eachSeries(abilities, function (ability, eachCb) {
//                          if(_.isUndefined(ability.charNames))
//                              ability.charNames = [];
//                          
//                          ability.charNames = charNames;
//                          
//                          return eachCb();
//                      }, function () {
//                          return abilCb(undefined, abilities);
//                      });
//                  },
//                  function (abilities, abilCb) {
//                      async.eachSeries(abilities, function (ability, eachCb) {
//                          console.log('writing ability for', hero.name);
//                          
//                          dbAbil.update({ _id: ability._id }, ability, eachCb);
//                      }, abilCb);
//                  }
//              ], heroCb);
//          });
//      }
//  ], function (err) {
//      if(err) { console.log("ERR:", err); }
//      
//      console.log("done");
//  });
});