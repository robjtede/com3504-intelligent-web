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
  var db = sql.getConnection();

  db.query(
    'SELECT * FROM searches ORDER BY id DESC LIMIT 10',
    function (err, trackings, fields) {
      if (err) throw new Error(err);

      db.query(
        'SELECT * FROM searches WHERE id = ?',
        [req.params.id],
        function (err, search, fields) {
          if (err) throw new Error(err);

          console.log(search);

          db.query(
            'SELECT * FROM tweets WHERE searches_id = ?',
            [req.params.id],
            function (err, tweets, fields) {
              if (err) throw new Error(err);

              // Render page
              res.render('track/show', {
                trackings: trackings,
                search: search[0],
                tweets: tweets
              });
            }
          );
        }
      );
    }
  );
};
