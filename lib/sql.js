'use strict';

var db = require('../config.json').db;
var moment = require('moment'); // Used for converting datetime

var mysql = require('mysql');

var getTweetsOLD = function (querySet, callback) {
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
  /*
  console.log('Player: ' + regexPlayer);
  console.log('Team: ' + regexTeam);
  console.log('Author: ' + regexAuthor);
  */
  var connection = getConnection();
  connection.connect();
  // Do retrieval here, using boolean operators in query consruction.
  // Note: regexes can be empty and will match against anything
  var sqlQuery = 'SELECT * FROM tweets WHERE content REGEXP (' +
    connection.escape(regexPlayer) + ') AND content REGEXP (' +
      connection.escape(regexTeam) + ') AND author REGEXP (' +
        connection.escape(regexAuthor) + ') ORDER BY datetime DESC';
  // console.log(sqlQuery);
  connection.query({
    sql: sqlQuery,
    timeout: 40000 // 40s
  }, function (error, results, fields) {
    connection.end();
    if (error) throw error;
    // callback(results);

    callback(results.map(function (tweet) {
      return {
        tweet_id: tweet.tweet_id,
        author: tweet.author,
        datetime: moment(tweet.datetime).format('YYYY-MM-DD HH:mm:ss'),
        content: tweet.content
      };
    }));
  });
};

var getTweets = function (id, callback) {
  var conn = getConnection();
  conn.connect();

  var sqlQuery = 'SELECT * FROM tweets WHERE searches_id = ' + conn.escape(id);
  // console.log(sqlQuery);
  conn.query({
    sql: sqlQuery,
    timeout: 40000 // 40s
  }, function (error, results, fields) {
    conn.end();
    if (error) throw error;
    // callback(results);

    callback(results.map(function (tweet) {
      return {
        tweet_id: tweet.tweet_id,
        author: tweet.author,
        datetime: moment(tweet.datetime).format('YYYY-MM-DD HH:mm:ss'),
        content: tweet.content
      };
    }));
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
  // console.log(time);
  conn.query({
    sql: 'INSERT INTO tweets (tweet_id, author, datetime, content, searches_id) VALUES (?, ?, ?, ?, ?)  ON DUPLICATE KEY UPDATE tweet_id=tweet_id',
    timeout: 40000, // 40s
    values: [tweet.tweet_id, tweet.author, time, text, trackId]
  }, function (error, results, fields) {
    if (error) throw error;
    // if (results) console.log(results);
    // if (fields) console.log(fields);
  });
};

function addSearch (termPlayer, termTeam, termAuthor, isAnd, callback) {
  var conn = getConnection();
  conn.connect();
  var modeStr = 'OR';
  if (isAnd) { modeStr = 'AND'; }
  conn.query({
    sql: 'INSERT INTO searches (player, team, author, mode) VALUES (?, ?, ?, ?)',
    timeout: 40000,
    values: [termPlayer, termTeam, termAuthor, modeStr]
  }, function (error, results, fields) {
    conn.end();
    if (error) {
      console.error(error);
      throw (error);
    }
    callback(results);
  });
};

function newTracking (q, isAnd, callback) {
  // Create a new search / tracking, after checking it doesn't already exist.
  // Callback with the id of the already present or new search
  getSearch(q, isAnd, function (results) {
    console.log('Old searches:');
    console.log(results);
    if (results.length === 0) {
      // No existing search exists, make a new one
      // TODO implement "isAnd" boolean according to checkbox
      addSearch(q.player, q.team, q.author, isAnd, function (newResults) {
        console.log('New search created!');
        console.log('New Search ID: ' + newResults.insertId);
        // Callback new id
        callback(newResults.insertId);
      });
    } else {
      // Existing search exists - callback old id
      callback(results[0].id);
      // TODO detection regularly fails
    }
  });
}

function getSearch (querySet, isAnd, callback) {
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
  var modeStr = 'OR';
  if (isAnd) modeStr = 'AND';
  /*
  console.log('Player: ' + regexPlayer);
  console.log('Team: ' + regexTeam);
  console.log('Author: ' + regexAuthor);
  */
  var conn = getConnection();
  conn.connect();
  // Do retrieval here, using boolean operators in query consruction.
  // Note: regexes can be empty and will match against anything
  // TODO mode in query
  var sqlQuery = 'SELECT * FROM searches WHERE player REGEXP (' +
    conn.escape(regexPlayer) + ') AND team REGEXP (' +
      conn.escape(regexTeam) + ') AND author REGEXP (' +
        conn.escape(regexAuthor) + ' AND mode = ' + conn.escape(modeStr) + ')';
  // console.log(sqlQuery);
  conn.query({
    sql: sqlQuery,
    timeout: 40000 // 40s
  }, function (error, results, fields) {
    conn.end();
    if (error) throw error;
    callback(results.map(function (search) {
      return {
        id: search.id,
        newestTweet: search.newestTweet
      };
    }));
  });
};

function getSearchTermsFromId (id, callback) {
  var conn = getConnection();
  conn.connect();

  var sqlQuery = 'SELECT * FROM searches WHERE id = ' + conn.escape(id);
  conn.query({
    sql: sqlQuery,
    timeout: 40000 // 40s
  }, function (error, results, fields) {
    conn.end();
    if (error) throw error;
    callback(results.map(function (search) {
      return {
        terms_player: search.player,
        terms_team: search.team,
        terms_author: search.author,
        search_mode: search.mode,
        newest_stored_tweet: search.newestTweet
      };
    }));
  });
}

function updateSearchNewestTweet (id, newestTweetId) {
  var conn = getConnection();
  conn.connect();

  var sqlQuery = 'UPDATE searches SET newestTweet = ' +
                  conn.escape(newestTweetId) + ' WHERE id = ' + conn.escape(id);
  conn.query({
    sql: sqlQuery,
    timeout: 40000
  }, function (error, results, fields) {
    conn.end();
    if (error) throw error;
  });
}

function getTrackingsList (callback) {
  var conn = getConnection();
  conn.connect();
  var sqlQuery = 'SELECT * FROM searches ORDER BY id DESC';
  conn.query({
    sql: sqlQuery,
    timeout: 40000
  }, function (error, results, fields) {
    conn.end();
    if (error) throw error;
    callback(results);
  });
}

function getConnection () {
  var connection = mysql.createConnection(
    {
      host: db.host,
      port: db.port,
      user: db.user,
      password: db.pass,
      database: db.name,
      charset: 'utf8mb4' // Set charset to support emojis, prevents crash
    }
  );
  return connection;
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
