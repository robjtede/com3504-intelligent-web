'use strict';

var sql = require('../lib/sql');
var querystring = require('querystring'); // Query parsing

module.exports = function (app) {
  app.get('/trackings/new/submit', create);
  app.get('/trackings/new', newTrack);
  app.get('/trackings/show/:id', show);
  app.post('/trackings', list);
  app.get('/trackings', list);
};

function newTrack (req, res) {
  res.render('track/new');
}

function create (req, res) {
  // console.log(req.query);

  var q = req.query;

  if (q.player || q.team || q.author) {
      // TODO change to switch button
    var isAndMode = false;
    if (q.querymode) {
      console.log('Mode: AND');
      isAndMode = true;
    } else {
      console.log('Mode: OR');
    }
    sql.newSearch(q, isAndMode, function (id) {
      console.log(id);
      // TODO redirect to new tracking view
      res.redirect('/trackings/show/' + id);
    });
    /*
    // Check if search present in database, for max id referencing.
    sql.getSearch(q, isAndMode, function (results) {
      console.log('Old searches:');
      console.log(results);
      if (results.length === 0) {
        // No existing search exists, make a new one
        // TODO implement "isAnd" boolean according to checkbox
        sql.addSearch(q.player, q.team, q.author, isAndMode, function (newResults) {
          console.log('New search created!');
          console.log('New Search ID: ' + newResults.insertId);
        });
      } else {
        // Existing search exists
        // TODO handle this issue
      }
    });
    */
  } else {
    // Invalid query
    res.redirect('/trackings');
  }
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
