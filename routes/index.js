'use strict';

const twitter = require('../lib/twitter');
const sql = require('../lib/sql');

module.exports = app => {
  app.get('/', getTweets);
};

const getTweets = function (req, res) {
  const q = req.query;
  if (Object.getOwnPropertyNames(q).length !== 0) {
  // Search if there is at least one query
    twitter
      .search(q)
      .then(function (data) {
        sql.insertTweetMulti(data); // Insert into database
      });

    sql.getTweets(q, function (results) {
      // console.log(results);
      res.render('index', {
        tweets: results,
        qPlayer: q.player,
        qTeam: q.team,
        qAuthor: q.author
      });
    });
  } else {
    // Render the page with no tweets
    console.log('No queries submitted!');
    res.render('index', {});
  }
};
