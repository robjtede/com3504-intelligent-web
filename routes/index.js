'use strict';

const twitter = require('../lib/twitter');
const sql = require('../lib/sql');
const moment = require('moment'); // Used for converting datetime

module.exports = (app, io) => {
  app.get('/', getTweets(io));
};

const getTweets = function (io) {
  return function (req, res) {
    const q = req.query;
    // Render page
    res.render('index', {
      qPlayer: q.player,
      qTeam: q.team,
      qAuthor: q.author
    });

    // Search if there is at least one query
    if (Object.getOwnPropertyNames(q).length !== 0) {
      // Socket connection
      io.on('connection', function (socket) {
        console.log('User connected.');

        // First retrieve from local db, this will be the fastest
        sql.getTweets(q, function (results) {
          // console.log(results);
          socket.emit('cachedTweets', results);
          socket.emit('getTweetFrequency', results.reduce(function (days, tweet) {
            const sod = moment(tweet.datetime).startOf('day');

            if (sod in days) days[sod]++;
            else days[sod] = 1;

            return days;
          }, {}));
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
            socket.emit('getTweetFrequency', data.reduce(function (days, tweet) {
              const sod = moment(tweet.datetime).startOf('day');

              if (sod in days) days[sod]++;
              else days[sod] = 1;

              return days;
            }, {}));
          });

        // Now listen to stream, adding to page as received
        twitter.stream(q, function (tweet) {
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
        });
      });
    }
  };
};
