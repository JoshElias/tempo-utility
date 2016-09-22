var MongoClient = require("mongodb");
var _ = require("underscore");
var async = require("async");
var sha1 = require("sha1");
var url = 'mongodb://localhost:27017/tempostorm';

function buildCards (deck, deckCards) {
    deck.cards = _.filter(deckCards, function (val) { return val.deckId === deck._id });
    return deck;
}

MongoClient.connect(url, function(err, db) {
    async.waterfall([
        function (waterfallCb) {
            db.collection('deck').find({}, {_id: 1}).toArray(function (err, decks) {
                if (err) return waterfallCb(err);
                return waterfallCb(null, decks);
            });
        },
        function (decks, waterfallCb) {
            async.forEachOf(decks, function (deck, idx, cb) {
                db.collection("deckCard").find({deckId:deck._id}).toArray(function (err, deckCards) {
                    var len = 0;
                    _.each(deckCards, function (val) { len += val.cardQuantity; });
                    if (len < 30 || err) return cb(err);

                    d = _.sortBy(deckCards, "cardId");
                    _.each(d, function (val) {
                        delete val._id;
                        delete val.deckId;
                    });
                    deck.hash = sha1(JSON.stringify(d));

                    return cb(err);
                });
            }, function (err) {
                return waterfallCb(err, decks)
            });
        },
        function (decks, waterfallCb) {
            async.forEachOf(decks, function (deck, idx, cb) {
                db.collection("deck").updateOne({_id: deck._id}, {$set: {hash: deck.hash}}, function (err) {
                    if (err) return cb(err);

                    console.log("[INFO] Successfully updated", deck._id);
                    return cb(err);
                })
            }, waterfallCb);
            // db.
        }
    ], function (err) {
        if (err) { console.log("[ERROR]", err); return; }
        console.log("done");
    })
});