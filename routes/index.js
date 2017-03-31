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
            // TODO remove tweets already in page
            socket.emit('getRemoteTweets', data);
            sql.insertTweetMulti(data); // Insert new tweets into database

            // count per day frequency
            socket.emit('getTweetFrequency', data.reduce(function (days, tweet) {
              if (tweet.datetime in days) days[tweet.datetime]++;
              else days[tweet.datetime] = 1;
            }, {}));
          });

        // Now listen to stream, adding to page as received
        twitter.stream(q, function (tweet) {
          var formattedTweet = {
            tweet_id: tweet.id,
            author: tweet.user.screen_name,
            datetime: moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').format('YYYY-MM-DD HH:mm:ss'),
            content: tweet.text
          };
          console.log(formattedTweet);
          // Insert tweet into db
        });

        // disconnect socket
        socket.on('disconnect', function () {
          console.log('User disconnected.');
        });
      });
    }
  };
};
