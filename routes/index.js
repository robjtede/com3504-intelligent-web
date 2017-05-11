'use strict';

module.exports = function (app) {
  app.get('/', index);
  app.get('/trackings', getTweets);
  app.get('/trackings/new', newTrack);
};

function index (req, res) {
  res.render('index');
}

function newTrack (req, res) {
  res.render('track/new');
}

function getTweets (req, res) {
  var q = req.query;

  // Render page
  res.render('search', {
    qPlayer: q.player,
    qTeam: q.team,
    qAuthor: q.author
  });
};
