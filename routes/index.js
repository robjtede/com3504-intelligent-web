'use strict';

const twitter = require('../lib/twitter');

module.exports = app => {
  app.get('/', getTweets);
};

const getTweets = function (req, res) {
  const q = req.param('query');

  twitter
    .search(q)
    .then(function (data) {
      res.render('index', {
        title: 'COM3504',
        tweets: data.statuses
      });
    });
};
