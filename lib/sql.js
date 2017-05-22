'use strict';

var db = require('../config.json').db;

var moment = require('moment');
var Promise = require('any-promise');
var mysql = require('mysql');

var getTweets = function (id) {
  var sqlQuery = 'SELECT * FROM tweets WHERE searches_id = ?';

  return query(sqlQuery, [id])
    .then(function (results) {
      return results.map(function (tweet) {
        return {
          tweet_id: tweet.tweet_id,
          author: tweet.author,
          datetime: moment(tweet.datetime).format('YYYY-MM-DD HH:mm:ss'),
          content: tweet.content
        };
      });
    });
};

function insertTweetMulti (tweets, trackId) {
  var sqlQuery = 'INSERT INTO tweets ' +
                 '(tweet_id, author, datetime, content, searches_id) VALUES ';

  var valuesStr = [];
  var values = [];

  tweets.forEach(function (tweet) {
    var time = tweet.datetime;
    var text = tweet.content;

    valuesStr.push('(?, ?, ?, ?, ?)');
    Array.prototype.push.apply(values, [tweet.tweet_id, tweet.author, time, text, trackId]);
  });

  sqlQuery += valuesStr.join(',');
  sqlQuery += ' ON DUPLICATE KEY UPDATE tweet_id=tweet_id';

  return query(sqlQuery, values);
};

function insertTweet (tweet, trackId) {
  var time = tweet.datetime;
  var text = tweet.content;

  var sqlQuery = 'INSERT INTO tweets ' +
  '(tweet_id, author, datetime, content, searches_id) ' +
  'VALUES (?, ?, ?, ?, ?) ' +
  'ON DUPLICATE KEY UPDATE tweet_id=tweet_id';

  return query(sqlQuery, [tweet.tweet_id, tweet.author, time, text, trackId]);
};

function addSearch (termPlayer, termTeam, termAuthor, isAnd) {
  var modeStr = isAnd ? 'AND' : 'OR';
  var sqlQuery = 'INSERT INTO searches (player, team, author, mode) VALUES (?, ?, ?, ?)';

  return query(sqlQuery, [termPlayer, termTeam, termAuthor, modeStr]);
};

function newTracking (q, isAnd) {
  // Create a new search / tracking, after checking it doesn't already exist.
  // return the id of the already present or new search
  return getSearch(q, isAnd)
    .then(function (results) {
      if (results.length === 0) {
        // No existing search exists, make a new one
        return addSearch(q.player, q.team, q.author, isAnd)
          .then(function (results) {
            return results.insertId;
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

  // Do retrieval here, using boolean operators in query consruction.
  // Note: regexes can be empty and will match against anything
  var sqlQuery = 'SELECT * FROM searches ' +
                 'WHERE player REGEXP (?) ' +
                 'AND team REGEXP (?) ' +
                 'AND author REGEXP (?) ' +
                 'AND mode = ?';

  return query(sqlQuery, [regexPlayer, regexTeam, regexAuthor, modeStr])
    .then(function (results) {
      return results.map(function (search) {
        return {
          id: search.id,
          newestTweet: search.newestTweet
        };
      });
    });
};

function getSearchTermsFromId (id) {
  var sqlQuery = 'SELECT * FROM searches WHERE id = ?';

  return query(sqlQuery, [id])
    .then(function (results) {
      return results.map(function (search) {
        return {
          terms_player: search.player,
          terms_team: search.team,
          terms_author: search.author,
          search_mode: search.mode,
          newest_stored_tweet: search.newestTweet
        };
      });
    });
}

function updateSearchNewestTweet (id, newestTweetId) {
  var sqlQuery = 'UPDATE searches ' +
                 'SET newestTweet = ? ' +
                 'WHERE id = ?';

  return query(sqlQuery, [newestTweetId, id]);
}

function getTrackingsList () {
  var sqlQuery = 'SELECT * FROM searches ORDER BY id DESC';

  return query(sqlQuery);
}

function query (query, params, conn) {
  if (!conn) conn = getConnection();

  return new Promise(function (resolve, reject) {
    conn.query({
      sql: query,
      values: params,
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
  query: query,
  getTweets: getTweets,
  insertTweet: insertTweet,
  insertTweetMulti: insertTweetMulti,
  addSearch: addSearch,
  getSearch: getSearch,
  getSearchFromId: getSearchTermsFromId,
  updateSearchNewestTweet: updateSearchNewestTweet,
  newTracking: newTracking,
  getTrackingsList: getTrackingsList
};
