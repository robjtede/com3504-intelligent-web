'use strict';

var moment = require('moment');
var Set = require('set');
var twitter = require('./lib/twitter');
var sql = require('./lib/sql');

var currentSockets = 0;

// Socket connection
module.exports = function (io) {
  io.on('connection', function (socket) {
    // console.log(++currentSockets + ' users connected.... new connect: ' + socket.id);
    console.log('new connection: ' + socket.id);

    // First retrieve from local db, this will be the fastest
    socket.on('join', function (client) {
      console.log('Socket joined!');
      console.log(client);
      var trackId = client.trackingId;

      sql.getSearchFromId(trackId, function (results) {
        console.log(results);
        var q = results[0];
        if (q) {
          // Search found, start sending tweets to client
          // Initialise set to track existing ids (prevent duplicate tweets)
          var existingIds = new Set();

          // Get stored tweets
          sql.getTweets(trackId, function (results) {
            socket.emit('cachedTweets', results); // Send tweets to client
            // Send frequencies to client
            socket.emit('getTweetFrequency', results.reduce(groupTweet, {}));
            for (var ind in results) {
              // console.log('LOCAL  - Added: ', results[ind].tweet_id);
              existingIds.add(results[ind].tweet_id); // Add id to existing ids
            }
          });

          // Now retrieve more tweets from twitter, and add to page
          twitter
          .search(q)
          .then(function (data) {
            // Filter duplicates from data, add new tweet ids to existing set
            var maxTweetId = data.maxTweetId;
            // Add max tweet id to search / tracking
            if (maxTweetId) sql.updateSearchNewestTweet(trackId, maxTweetId);
            var fltData = data.tweets.filter(function (elem) {
              if (!existingIds.contains(elem.tweet_id)) {
                existingIds.add(elem.tweet_id);
                // console.log('REMOTE - Unique: ', elem.tweet_id);
                return true;
              } else {
                // console.log('REMOTE - Existing: ', elem.tweet_id);
                return false;
              }
            });
            // Send dates to page
            socket.emit('getRemoteTweets', fltData);
            // Insert new tweets into database
            sql.insertTweetMulti(fltData, trackId);
            // count per day frequency
            socket.emit('getTweetFrequency', fltData.reduce(groupTweet, {}));
          });

          // Start streaming tweets
          // Now listen to stream, adding to page as received

          // TODO fix issue of too many tweets crashing page, perhaps just limit amount streamedTweet
          // disabled streaming until fixed for stability (eg streaming "please" crashes page)
          /*
          var tweetStream = twitter.stream(q);

          tweetStream.on('tweet', function (tweet) {
            // Format tweet for consistency
            var formattedTweet = {
              tweet_id: tweet.id,
              author: tweet.user.screen_name,
              datetime: moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').format('YYYY-MM-DD HH:mm:ss'),
              content: tweet.text
            };
            if (!existingIds.contains(formattedTweet.tweet_id)) {
              console.log('STREAM - Unique: ', formattedTweet.tweet_id);
                // Insert into db
              sql.insertTweetSingle(formattedTweet, trackId);
              // update max id of search
              sql.updateSearchNewestTweet(trackId, formattedTweet.tweet_id);

                // Send tweet to page
              socket.emit('streamedTweet', formattedTweet);
            } else {
              console.log('STREAM - Existing: ', formattedTweet.tweet_id);
            }
          });

          // check disconnected socket
          socket.on('disconnect', function () {
            console.log('User disconnected.');
            // currentSockets--;
            tweetStream.stop();
          });
          */
        } else {
          // No search, invalid id or error
          // TODO handle
        }
      });
      /*
      q = client;
      // Check query isn't empty

      if (q.player || q.team || q.author) {
        // Initialise set to track existing ids (prevent duplicate tweets)
        var existingIds = new Set();

        // TODO Check if search present in database, for max id referencing.
        sql.getSearch(q, function (results) {
          console.log('Old searches:');
          console.log(results);
          if (results.length === 0) {
            // TODO implement "isAnd" boolean according to checkbox
            sql.addSearch(q.player, q.team, q.author, true, function (newResults) {
              console.log('New search created!');
              console.log('New Search ID: ' + newResults.insertId);
            });
          }
        });
        // TODO Add search to database if it isn't present

        // Get tweets from database
        sql.getTweets(q, function (results) {
          socket.emit('cachedTweets', results); // Send tweets to client
          // Send frequencies to client
          socket.emit('getTweetFrequency', results.reduce(groupTweet, {}));
          for (var ind in results) {
            // console.log('LOCAL  - Added: ', results[ind].tweet_id);
            existingIds.add(results[ind].tweet_id); // Add id to existing ids
          }
        });

        // Now retrieve more tweets from twitter, and add to page
        twitter
        .search(q)
        .then(function (data) {
          // Filter duplicates from data, add new tweet ids to existing set
          var fltData = data.filter(function (elem) {
            if (!existingIds.contains(elem.tweet_id)) {
              existingIds.add(elem.tweet_id);
              // console.log('REMOTE - Unique: ', elem.tweet_id);
              return true;
            } else {
              // console.log('REMOTE - Existing: ', elem.tweet_id);
              return false;
            }
          });
          // Send dates to page
          socket.emit('getRemoteTweets', fltData);

          // Insert new tweets into database
          sql.insertTweetMulti(fltData);

          // count per day frequency
          socket.emit('getTweetFrequency', fltData.reduce(groupTweet, {}));
        });

      // Now listen to stream, adding to page as received

        var tweetStream = twitter.stream(q);

        tweetStream.on('tweet', function (tweet) {
        // Format tweet for consistency
          var formattedTweet = {
            tweet_id: tweet.id,
            author: tweet.user.screen_name,
            datetime: moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').format('YYYY-MM-DD HH:mm:ss'),
            content: tweet.text
          };
          if (!existingIds.contains(formattedTweet.tweet_id)) {
            console.log('STREAM - Unique: ', formattedTweet.tweet_id);
            // Insert into db
            sql.insertTweetSingle(formattedTweet);

            // Send tweet to page
            socket.emit('streamedTweet', formattedTweet);
          } else {
            console.log('STREAM - Existing: ', formattedTweet.tweet_id);
          }
        });

      // check disconnected socket
        socket.on('disconnect', function () {
          console.log('User disconnected.');
        // currentSockets--;
          tweetStream.stop();
        });
      }*/
    });
  });
};

function groupTweet (days, tweet) {
  var sod = moment(tweet.datetime).startOf('day');

  if (sod in days) days[sod]++;
  else days[sod] = 1;

  return days;
}
