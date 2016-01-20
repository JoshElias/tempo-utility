var MongoClient = require("mongodb");
var async = require("async");

var prodUrl = 'mongodb://52.11.14.8:27017,52.8.169.246:27017,54.174.103.94:27017,52.28.87.90:27017,54.79.121.240:27017/tempostorm';
var stagingUrl = 'mongodb://54.68.67.60:27017/new-tempostorm';


MongoClient.connect(prodUrl, function(err, prodDb) {
    if(err) {
      console.log("ERR");
      console.log(err);
      return;
    }

    MongoClient.connect(stagingUrl, function(err, stagingDb) {
      if(err) {
        console.log("ERR");
        console.log(err);
        return;
      }

      var ProdComment = prodDb.collection("comment");
      var StagingComment = stagingDb.collection("comment");

      async.waterfall([
          // Associate snapshot comments
          function(seriesCb) {
              stagingDb.collection("snapshot").find({}).toArray(seriesCb);
          },
          function(snapshots, seriesCb) {
      
              async.eachSeries(snapshots, function(snapshot, snapshotCb) {
                  async.eachSeries(snapshot.oldComments, function(commentId, commentCb) {
                      StagingComment.findOne({_id:commentId}, function(err, commentInstance) {
                          if(err) return commentCb(err);
                          if(!commentInstance) return commentCb();

                          var newComment = commentInstance;
                          newComment.snapshotId = snapshot._id;

                          ProdComment.updateOne({_id:commentId}, newComment, function(err) {
                              if(!err) console.log("successfully updated snapshot comment", commentId);
                              return commentCb(err);
                          });
                      });  
                  }, snapshotCb);
              }, seriesCb);
          },

          // Associate article comments
          function(seriesCb) {
              stagingDb.collection("article").find({}).toArray(seriesCb);
          },
          function(articles, seriesCb) {
      
              async.eachSeries(articles, function(article, articleCb) {
                  async.eachSeries(article.oldComments, function(commentId, commentCb) {
                       StagingComment.findOne({_id:commentId}, function(err, commentInstance) {
                          if(err) return commentCb(err);
                          if(!commentInstance) return commentCb();

                          var newComment = commentInstance;
                          newComment.articleId = article._id;

                          ProdComment.updateOne({_id:commentId}, newComment, function(err) {
                              if(!err) console.log("successfully updated article comment", commentId);
                              return commentCb(err);
                          });
                      });  
                  }, articleCb);
              }, seriesCb);
          },

          // Associate deck comments
          function(seriesCb) {
              stagingDb.collection("deck").find({}).toArray(seriesCb);
          },
          function(decks, seriesCb) {
      
              async.eachSeries(decks, function(deck, articleCb) {
                  async.eachSeries(deck.oldComments, function(commentId, commentCb) {
                       StagingComment.findOne({_id:commentId}, function(err, commentInstance) {
                          if(err) return commentCb(err);
                          if(!commentInstance) return commentCb();

                          var newComment = commentInstance;
                          newComment.deckId = deck._id;

                          ProdComment.updateOne({_id:commentId}, newComment, function(err) {
                              if(!err) console.log("successfully updated deck comment", commentId);
                              return commentCb(err);
                          });
                      });  
                  }, articleCb);
              }, seriesCb);
          },
      function(err) {
          prodDb.close();
          stagingDb.close();
          if(!err) return console.log("Donnerino");
          console.log("Comment migration err", err);
      }])

  });
});