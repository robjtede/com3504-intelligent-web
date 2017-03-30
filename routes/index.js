'use strict';

const twitter = require('../lib/twitter');

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
        res.render('index', {
          tweets: data.statuses,
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
