var MongoClient = require("mongodb");
var ObjectID = require("mongodb").ObjectID;
var async = require("async");
var _ = require("underscore");
var async = require("async");

var url = 'mongodb://52.11.14.8:27017,52.8.169.246:27017,54.174.103.94:27017,52.28.87.90:27017,54.79.121.240:27017/tempostorm';

MongoClient.connect(url, function(err, db) {
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
            console.log("err", err);
            return; 
        }
        
        console.log("votes saved successfully");
    });
    
    function doMigration (cb) {
        var collections = [
            "deck",
            "guide",
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
});