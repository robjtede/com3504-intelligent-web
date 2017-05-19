'use strict';

var moment = require('moment');
var Set = require('set');
var twitter = require('./lib/twitter');
var sql = require('./lib/sql');

var currentSockets = 0;

function getCachedTweets (socket, trackingId) {
  // Get stored tweets
  sql.getTweets(trackingId, function (results) {
    socket.emit('cachedTweets', results); // Send tweets to client
    // Send frequencies to client
    socket.emit('getTweetFrequency', results.reduce(groupTweet, {}));
  });
}

function getRemoteTweets (socket, q, trackingId) {
  twitter
    .search(q)
    .then(function (data) {
      console.log('remote tweets length', data);

      // Filter duplicates from data, add new tweet ids to existing set
      var maxTweetId = data.maxTweetId;
      // Add max tweet id to search / tracking
      if (maxTweetId) sql.updateSearchNewestTweet(trackingId, maxTweetId);
      var tweets = data.tweets;
      // Send dates to page
      socket.emit('getRemoteTweets', tweets);
      // Insert new tweets into database
      sql.insertTweetMulti(tweets, trackingId);
      // count per day frequency
      socket.emit('getTweetFrequency', tweets.reduce(groupTweet, {}));
      // return existIds;
    }).catch(function (err) {
      console.log('Error in obtaining tweets.');
      console.error(err);
    });
}

// Socket connection
module.exports = function (io) {
  io.on('connection', function (socket) {
    // console.log(++currentSockets + ' users connected.... new connect: ' + socket.id);
    console.log('new connection: ' + socket.id);

    // Add new tracking
    socket.on('newTracking', function (client) {
      // Read client's input data
      // Note: isAnd refers to the checkbox for AND/OR mode
      //       - enabled = AND, OR otherwise (including if no field present)
      if (client.player || client.team || client.author) {
        console.log(client);
        var isAndMode = false;
        if (client.isAnd) isAndMode = true;
        sql.newTracking(client, isAndMode, function (searchId) {
          console.log('Tracking ID created or existing found: ' + searchId);
		  socket.emit('NewTrackingID', {
			NewID: searchId
		  });
        });
		
      }
    });

    // Get list of every tracking present in database.
    // Note: a tracking's id can be used passed into the client's "trackingId"
    //        field for the socket "join" event to get its tweets
    socket.on('getTrackingsList', function (client) {
      sql.getTrackingsList(function (results) {
        if (results[0]) {
          // Has results
          socket.emit('serverTrackingsList', results);
        }
      });
    });

    socket.on('requestRemoteTweets', function (client) {
      var trackId = client.trackingId;
      console.log('SOCKET GET REMOTE WITH ID: ' + trackId);
      sql.getSearchFromId(trackId, function (results) {
        console.log(results);
        var q = results[0];
        if (q) {
          // Now retrieve more tweets from twitter, and add to page
          getRemoteTweets(socket, q, trackId);
          // TODO fix issue of too many tweets crashing page, perhaps just limit amount of streamed tweets

          // Start streaming tweets
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
            // Insert into db
            sql.insertTweetSingle(formattedTweet, trackId);
            // update max id of search
            sql.updateSearchNewestTweet(trackId, formattedTweet.tweet_id);

            // Send tweet to page
            socket.emit('streamedTweet', formattedTweet);
          });

          // check disconnected socket
          socket.on('disconnect', function () {
            console.log('User disconnected.');
            // currentSockets--;
            tweetStream.stop();
          });
        } else {
          // No tracking found
          // TODO handle
        }
      });
    });

    // Standard client connection
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

          // Get tweets from database
          getCachedTweets(socket, trackId);
        } else {
          // No search, invalid id or error
          // TODO handle
        }
      });
    });
  });
};

function groupTweet (days, tweet) {
  var sod = moment(tweet.datetime).startOf('day');

  if (sod in days) days[sod]++;
  else days[sod] = 1;

  return days;
}
