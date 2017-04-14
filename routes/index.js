'use strict';

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
