'use strict';

var sql = require('../lib/sql');

module.exports = function (app) {
  app.get('/trackings/new', newTrack);
  app.get('/trackings/:id', show);
  app.post('/trackings', list);
  app.get('/trackings', list);
};

function newTrack (req, res) {
  res.render('track/new');
}

function create (req, res) {

}

function list (req, res) {
  var db = sql.getConnection();

  db.query(
    'SELECT * FROM searches ORDER BY id DESC LIMIT 10',
    function (err, results, fields) {
      if (err) throw new Error(err);

      db.query(
        'SELECT * FROM searches ORDER BY id DESC',
        function (err, results, fields) {
          if (err) throw new Error(err);

          res.render('track/list', {
            trackings: results
          });
        }
      );
    }
  );
}

function show (req, res) {
  var q = req.query;
  var db = sql.getConnection();

  db.query(
    'SELECT * FROM searches ORDER BY id DESC LIMIT 10',
    function (err, results, fields) {
      if (err) throw new Error(err);

        // Render page
      res.render('track/show', {
        player: q.player,
        team: q.team,
        author: q.author,
        trackings: results
      });
    }
  );
};
