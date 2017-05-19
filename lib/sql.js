'use strict';

var db = require('../config.json').db;
var moment = require('moment'); // Used for converting datetime

var Promise = require('any-promise');
var mysql = require('mysql');

var getTweets = function (id) {
  var conn = getConnection();

  var sqlQuery = 'SELECT * FROM tweets WHERE searches_id = ' + conn.escape(id);

  return new Promise(function (resolve, reject) {
    conn.query({
      sql: sqlQuery,
      timeout: 40000 // 40s
    }, function (error, results, fields) {
      conn.end();
      if (error) reject(new Error(error));

      resolve(results.map(function (tweet) {
        return {
          tweet_id: tweet.tweet_id,
          author: tweet.author,
          datetime: moment(tweet.datetime).format('YYYY-MM-DD HH:mm:ss'),
          content: tweet.content
        };
      }));
    });
  });
};

var insertTweetSingle = function (tweet, trackId) {
  var connection = getConnection();
  connection.connect();
  insTweet(tweet, connection, trackId);
  connection.end();
};

function insertTweetMulti (tweets, trackId) {
  var connection = getConnection();
  connection.connect();
  for (var indx in tweets) {
    var tweet = tweets[indx];
    insTweet(tweet, connection, trackId);
  }
  connection.end();
};

function insTweet (tweet, conn, trackId) {
  var time = tweet.datetime;
  var text = tweet.content;

  return new Promise(function (resolve, reject) {
    conn.query({
      sql: 'INSERT INTO tweets (tweet_id, author, datetime, content, searches_id) VALUES (?, ?, ?, ?, ?)  ON DUPLICATE KEY UPDATE tweet_id=tweet_id',
      timeout: 40000,
      values: [tweet.tweet_id, tweet.author, time, text, trackId]
    }, function (error, results, fields) {
      if (error) reject(new Error(error));

      resolve(results);
    });
  });
};

function addSearch (termPlayer, termTeam, termAuthor, isAnd) {
  var conn = getConnection();

  var modeStr = isAnd ? 'AND' : 'OR';

  return new Promise(function (resolve, reject) {
    conn.query({
      sql: 'INSERT INTO searches (player, team, author, mode) VALUES (?, ?, ?, ?)',
      timeout: 40000,
      values: [termPlayer, termTeam, termAuthor, modeStr]
    }, function (error, results, fields) {
      conn.end();
      if (error) reject(new Error(error));

      resolve(results);
    });
  });
};

function newTracking (q, isAnd) {
  // Create a new search / tracking, after checking it doesn't already exist.
  // return the id of the already present or new search
  return getSearch(q, isAnd)
    .then(function (results) {
      if (results.length === 0) {
        // No existing search exists, make a new one
        return addSearch(q.player, q.team, q.author, isAnd)
          .then(function (search) {
            return results[0].id;
          });
      } else {
        // TODO detection regularly fails
        // Existing search exists - callback old id
        return results[0].id;
      }
    });
}

function getSearch (querySet, isAnd) {
  // TODO only get searches where ALL subqueries are present
  // Remove spaces from queries, and split into regexes by
  // replacing commas with pikes (|).
  // Also remove '@' from author, as this is implied by comparing to 'Author'.
  var regexPlayer = querySet.player.replace(/\s+/g, '').replace(/,/g, '|');
  var regexTeam = querySet.team.replace(/\s+/g, '').replace(/,/g, '|');
  var regexAuthor = querySet.author.replace(/\s+/g, '').replace(/@/g, '').replace(/,/g, '|');

  // Replace empty regexes with '$' to match any string.
  if (regexPlayer === '') regexPlayer = '$';
  if (regexTeam === '') regexTeam = '$';
  if (regexAuthor === '') regexAuthor = '$';

  // AND / OR checking
  var modeStr = isAnd ? 'AND' : 'OR';

  var conn = getConnection();

  // Do retrieval here, using boolean operators in query consruction.
  // Note: regexes can be empty and will match against anything
  var sqlQuery = 'SELECT * FROM searches WHERE player REGEXP (' +
    conn.escape(regexPlayer) + ') AND team REGEXP (' +
    conn.escape(regexTeam) + ') AND author REGEXP (' +
    conn.escape(regexAuthor) + ' AND mode = ' + conn.escape(modeStr) + ')';

  return new Promise(function (resolve, reject) {
    conn.query({
      sql: sqlQuery,
      timeout: 40000
    }, function (error, results, fields) {
      conn.end();
      if (error) reject(new Error(error));

      resolve(results.map(function (search) {
        return {
          id: search.id,
          newestTweet: search.newestTweet
        };
      }));
    });
  });
};

function getSearchTermsFromId (id) {
  var conn = getConnection();

  var sqlQuery = 'SELECT * FROM searches WHERE id = ' + conn.escape(id);

  return new Promise(function (resolve, reject) {
    conn.query({
      sql: sqlQuery,
      timeout: 40000
    }, function (error, results, fields) {
      conn.end();
      if (error) reject(new Error(error));

      resolve(results.map(function (search) {
        return {
          terms_player: search.player,
          terms_team: search.team,
          terms_author: search.author,
          search_mode: search.mode,
          newest_stored_tweet: search.newestTweet
        };
      }));
    });
  });
}

function updateSearchNewestTweet (id, newestTweetId) {
  var conn = getConnection();

  var sqlQuery = 'UPDATE searches SET newestTweet = ' +
                  conn.escape(newestTweetId) + ' WHERE id = ' + conn.escape(id);
  return new Promise(function (resolve, reject) {
    conn.query({
      sql: sqlQuery,
      timeout: 40000
    }, function (error, results, fields) {
      conn.end();
      if (error) reject(new Error(error));

      resolve();
    });
  });
}

function getTrackingsList (callback) {
  var conn = getConnection();

  var sqlQuery = 'SELECT * FROM searches ORDER BY id DESC';

  return new Promise(function (resolve, reject) {
    conn.query({
      sql: sqlQuery,
      timeout: 40000
    }, function (error, results, fields) {
      conn.end();
      if (error) reject(new Error(error));

      resolve(results);
    });
  });
}

function getConnection () {
  return mysql.createConnection({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.pass,
    database: db.name,
    charset: 'utf8mb4'
  });
}

module.exports = {
  getConnection: getConnection,
  getTweets: getTweets,
  insertTweetSingle: insertTweetSingle,
  insertTweetMulti: insertTweetMulti,
  addSearch: addSearch,
  getSearch: getSearch,
  getSearchFromId: getSearchTermsFromId,
  updateSearchNewestTweet: updateSearchNewestTweet,
  newTracking: newTracking,
  getTrackingsList: getTrackingsList
};
