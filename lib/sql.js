'use strict';

const db = require('../config.json').db;
const moment = require('moment'); // Used for converting datetime

var mysql = require('mysql');

module.exports.getTweets = function (querySet, callback) {
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
  const sqlQuery = 'SELECT * FROM tweets WHERE content REGEXP (' +
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

module.exports.insertTweetSingle = function (tweet) {
  var connection = getConnection();
  connection.connect();
  insTweet(tweet, connection);
  connection.end();
};

module.exports.insertTweetMulti = function (tweets) {
  var connection = getConnection();
  connection.connect();
  for (var indx in tweets) {
    var tweet = tweets[indx];
    insTweet(tweet, connection);
  }
  connection.end();
};

function insTweet (tweet, conn) {
  var time = tweet.datetime;
  var text = tweet.content;
  // console.log(time);
  conn.query({
    sql: 'INSERT INTO tweets (tweet_id, author, datetime, content) VALUES (?, ?, ?, ?)  ON DUPLICATE KEY UPDATE tweet_id=tweet_id',
    timeout: 40000, // 40s
    values: [tweet.tweet_id, tweet.author, time, text]
  }, function (error, results, fields) {
    if (error) throw error;
    // if (results) console.log(results);
    // if (fields) console.log(fields);
  });
};

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
