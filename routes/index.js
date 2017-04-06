'use strict';

module.exports = app => {
  app.get('/', renderPage);
};

function renderPage (req, res) {
  const q = req.query;

  // Render page
  res.render('index', {
    qPlayer: q.player,
    qTeam: q.team,
    qAuthor: q.author
  });
};
