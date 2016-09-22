var MongoClient = require("mongodb");
var ObjectID = require("mongodb").ObjectID;
var async = require("async");
var _ = require("underscore");
var async = require("async");

var url = 'mongodb://localhost:27017/tempostorm';

MongoClient.connect(url, function(err, db) {
    if(err) {
        console.log("ERR");
        console.log(err);
        return;
    }

    async.waterfall([
        getHeroes,
        getTalents,
        checkTalents,
        final
    ], function () {

    });

    function getHeroes (cb) {
        db.collection('heroTalent').find({}).toArray(function(err, documents) {
            return cb(err, documents);
        })
    }

    function getTalents (heroes, cb) {
        db.collection('talent').find({}).toArray(function (err, documents) {
            return cb(err, heroes, documents);
        });

    }

    function checkTalents (heroes, talents, cb) {
        var unusedTalents = [];

        _.each(talents, function (talent) {
            var temp = _.find(heroes, function (heroTalent) {
                var talId = talent._id.toString();
                var hTalId = heroTalent.talentId.toString();

                return talId == hTalId;
            });

            if (!temp && talent.name != '__missing') {
                console.log('Found unused talent: ', temp);
                unusedTalents.push(talent);
            }
        });

        // console.log('final', documents.length);

        return cb(undefined, unusedTalents);
    }

    function final (unused, cb) {
        var unusedNames = _.map(unused, '_id');

        async.forEach(unused, function (val, eachCb) {
            var id = val._id;
            val.className = '__missing';

            db.collection('talent').update({'_id': id}, val, {upsert: false, multi: false}, function (err, doc) {
                if(err)
                    return eachCb(err);

                // console.log('updated', doc);
                return eachCb();
            });
        });

    }
});