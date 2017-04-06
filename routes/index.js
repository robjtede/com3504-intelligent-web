'use strict';

var moment = require('moment'); // Used for converting datetime

module.exports = function (app) {
  app.get('/', getTweets);
};

function getTweets (req, res) {
  var q = req.query;

  // Render page
  res.render('index', {
    qPlayer: q.player,
    qTeam: q.team,
    qAuthor: q.author
  });
};
