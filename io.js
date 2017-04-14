'use strict';

var moment = require('moment');
var twitter = require('./lib/twitter');
var sql = require('./lib/sql');

var currentSockets = 0;

// Socket connection
module.exports = function (io) {
  io.on('connection', function (socket) {
    // console.log(++currentSockets + ' users connected.... new connect: ' + socket.id);
    console.log('new connection: ' + socket.id);

    var q = null;

    // First retrieve from local db, this will be the fastest
    socket.on('join', function (client) {
      console.log(client);
      q = client;
      // Check query isn't empty
      if (q.player || q.team || q.author) {
        sql.getTweets(q, function (results) {
          socket.emit('cachedTweets', results);
          socket.emit('getTweetFrequency', results.reduce(groupTweet, {}));
        });

        // Now retrieve more tweets from twitter, and add to page
        twitter
        .search(q)
        .then(function (data) {
          // Send dates to page
          socket.emit('getRemoteTweets', data);

          // Insert new tweets into database
          sql.insertTweetMulti(data);

          // count per day frequency
          socket.emit('getTweetFrequency', data.reduce(groupTweet, {}));
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

        // Insert into db
          sql.insertTweetSingle(formattedTweet);

        // Send tweet to page
          socket.emit('streamedTweet', formattedTweet);
        });

      // disconnect socket
        socket.on('disconnect', function () {
          console.log('User disconnected.');
        // currentSockets--;
          tweetStream.stop();
        });
      }
    });
  });
};

function groupTweet (days, tweet) {
  var sod = moment(tweet.datetime).startOf('day');

  if (sod in days) days[sod]++;
  else days[sod] = 1;

  return days;
}
