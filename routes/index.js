'use strict';

const twitter = require('../lib/twitter');
const sql = require('../lib/sql');

module.exports = (app, io) => {
  app.get('/', getTweets(io));
};

const getTweets = function (io) {
  return function (req, res) {
    const q = req.query;
    // Search if there is at least one query
    if (Object.getOwnPropertyNames(q).length !== 0) {
      // First retrieve from local db, this will be the fastest
      sql.getTweets(q, function (results) {
        // console.log(results);
        res.render('index', {
          tweets: results,
          qPlayer: q.player,
          qTeam: q.team,
          qAuthor: q.author
        });
      });

      // Socket connection
      io.on('connection', function (socket) {
        console.log('User connected.');
        // Now retrieve more tweets from twitter, and add to page
        twitter
          .search(q)
          .then(function (data) {
            // TODO remove tweets already in page
            socket.emit('gettweets', data);
            sql.insertTweetMulti(data); // Insert new tweets into database
          });

        // disconnect socket
        socket.on('disconnect', function () {
          console.log('User disconnected.');
        });
      });

      // Now listen to stream, adding to page as received
      // TODO stream api
    } else {
    // Render the page with no tweets
      console.log('No queries submitted!');
      res.render('index', {});
    }
  };
};
