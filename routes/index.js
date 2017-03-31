'use strict';

const moment = require('moment'); // Used for converting datetime

module.exports = app => {
  app.get('/', getTweets);
};

function getTweets (req, res) {
  const q = req.query;

  // Render page
  res.render('index', {
    qPlayer: q.player,
    qTeam: q.team,
    qAuthor: q.author
  });
};
