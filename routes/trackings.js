'use strict';

var sql = require('../lib/sql');

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
  var q = req.query;

  if (q.player || q.team || q.author) {
    // TODO change to switch button
    var isAndMode = q.querymode;

    sql.newSearch(q, isAndMode)
      .then(function (id) {
        console.log(id);

        // redirect to new tracking view
        res.redirect('/trackings/show/' + id);
      });
  } else {
    // Invalid query
    res.redirect('/trackings');
  }
}

function list (req, res) {
  return sql.query('SELECT * FROM searches ORDER BY id DESC')
    .then(function (results) {
      res.render('track/list', {
        trackings: results
      });
    });
}

function show (req, res) {
  var recentCache;
  var search;

  return sql.query('SELECT * FROM searches ORDER BY id DESC LIMIT 10')
    .then(function (recent) {
      recentCache = recent;
      return sql.query('SELECT * FROM searches WHERE id = ?', [req.params.id]);
    })
    .then(function (searches) {
      search = searches[0];
      return sql.query('SELECT * FROM tweets WHERE searches_id = ?', [req.params.id]);
    })
    .then(function (tweets) {
      // Render page
      res.render('track/show', {
        trackings: recentCache,
        search: search,
        tweets: tweets
      });
    });
};
