var MongoClient     = require("mongodb");
var json2csv        = require("json2csv");
var async           = require("async");
var fs              = require("fs");
var _               = require("underscore");

var url             = 'mongodb://localhost:27017/tempostorm';

function generateCSVFields(list) {
    var a = [];

    _.each(list, function (val) {
        _.each(val, function (v, key) {
            if (!_.contains(a, key)) {
                a.push(key);
            }
        });
    });

    return a;
}

function writeToCSV(name, list, callback) {
    if ("undefined" == typeof name) { throw "You must specify a file name"; }
    if ("undefined" == typeof list) { throw "You must provide a list"; }

    var csv = json2csv({ data: list, fields: generateCSVFields(list) });

    fs.writeFile('.\\cards\\csv\\' + name + '.csv', csv, function(err) {
        if ("function" == typeof callback) {
            if (err) return callback(err);

            return callback(null);
        } else if (err) {
            throw err;
        }
    });
}

MongoClient.connect(url, function(err, db) {
    var fileName = "9.12.2016.json";
    var f = fs.readFileSync(".\\cards\\" + fileName, 'utf8');
    var j = JSON.parse(f);
    var map = {
        id:     "hearthstoneId",
        attack: "attack",
        health: "health",
        flavor: "flavor",
        type:   "cardType"
    };

    var arrs = {
        matched         : [],
        homeless        : [],
        duplicates      : []
    };

    function mapToCard(card, hc) {
        _.each(map, function (mapVal, mapKey) {
            card[mapVal] = hc[mapKey];
        });

        return card;
    }


    db.collection("card").find().toArray(function (err, c) {
        var i = 0;
        _.each(c, function (card) {
            var hc = _.filter(j, function (val) {
                return val.name == card.name;
            });
            if (hc.length == 0 || "undefined" == typeof hc) { arrs.homeless.push(card); return; }
            if (hc.length > 1) {
                var potential = _.filter(hc, function (val) {
                    if (typeof card.cardType === "undefined") {
                        card.cardType = val.type.toLowerCase();
                    }

                    return card.cardType.toLowerCase() == val.type.toLowerCase();
                });

                //we check here if the length of potential is greater than 1, if it is eq to 1 then we know that it
                //has multiples of the same name but the other duplicates are simply just tokens which we send to
                //homeless, or maybe an other token arr which we may need to make
                if (potential.length === 1) {
                    var idx = hc.indexOf(potential[0]);

                    _.each(hc, function (val, i) {
                        if (i === idx) {
                            arrs.matched.push(val);
                        } else {
                            arrs.homeless.push(val);
                        }
                    });

                    return;
                }

                //if we get to this far then the potential duplicate was an actual duplicate for whatever reason.
                //we handle that by logging it out and pushing it to the duplicate array
                console.log("\n-----------------------DUPLICATES FOUND-----------------------");
                console.log("Card:", card);
                console.log("\nDuplicates:");
                _.each(hc, function (h) {
                    console.log("-", h);
                    if (typeof card.cardType === "undefined") {
                        card.cardType = h.type.toLowerCase();
                    }

                    console.log(card.cardType.toLowerCase() == h.type.toLowerCase());
                });

                arrs.duplicates.push(hc);
                return;
            }
            if (hc.length == 1) { hc = hc[0]; }




        });

        console.log(arrs.duplicates);
        // console.log(arrs.homeless.length);

        // console.log("-----------------------HOMELESS CARDS-----------------------");
        // console.log("::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::");
        // console.log(arrs.homeless);
        // console.log("::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::");
        // console.log("Homeless card length:", arrs.homeless.length);
        //
        // console.log("-----------------------DUPLICATE CARDS-----------------------");
        // console.log(":::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::");
        // console.log(arrs.duplicates);
        // console.log(":::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::");
        // console.log("Duplicate card length:", arrs.duplicates.length);
        // console.log(duplicates);

        async.forEach()

        process.exit();

        ////////////////////////////////////////////
        //CSV THE CARDS THAT DON'T EXIST IN OUR DB//
        ////////////////////////////////////////////
        // var l = _.reject(j, function (jv) {
        //     return _.find(c, function (cv) {
        //         return cv.name == jv.name;
        //     });
        // });
        //
        // l = _.sortBy(l, "name");
        // l = _.sortBy(l, "set");
        //
        // writeToCSV("unTrackedCards", l, function (err) {
        //     console.log('doot');
        // });
        ////////////////////////////////////////////
    });

});