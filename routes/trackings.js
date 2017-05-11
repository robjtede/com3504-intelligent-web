'use strict';

var sql = require('../lib/sql');

module.exports = function (app) {
  app.get('/trackings/new', newTrack);
  app.get('/trackings/:id', show);
  app.get('/trackings', list);
};

function newTrack (req, res) {
  res.render('track/new');
}

function list (req, res) {
  var db = sql.getConnection();

  db.query(
    'SELECT * FROM searches ORDER BY id DESC LIMIT 10',
    function (err, results, fields) {
      if (err) throw new Error(err);

      console.log(results);
      res.render('track/list', {
        trackings: results
      });
    }
  );
}

function show (req, res) {
  var q = req.query;

  // Render page
  res.render('track/show', {
    qPlayer: q.player,
    qTeam: q.team,
    qAuthor: q.author
  });
};
