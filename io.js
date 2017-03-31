'use strict';

const moment = require('moment');
const twitter = require('./lib/twitter');
const sql = require('./lib/sql');

let currentSockets = 0;

// Socket connection
module.exports = function (io) {
  io.on('connection', function (socket) {
    console.log(++currentSockets + ' users connected.... new connect: ' + socket.id);

    let q = null;

    // First retrieve from local db, this will be the fastest
    socket.on('join', function (data) {
      console.log(data);
      q = data;

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
      const stream = twitter.stream(q, function (tweet) {
        // Format tweet for consistency
        const formattedTweet = {
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
        currentSockets--;
        stream.stop();
      });
    });
  });
};

function groupTweet (days, tweet) {
  const sod = moment(tweet.datetime).startOf('day');

  if (sod in days) days[sod]++;
  else days[sod] = 1;

  return days;
}
