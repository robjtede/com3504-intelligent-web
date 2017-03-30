'use strict';

const db = require('../config.json').db;
const moment = require('moment'); // Used for converting datetime

var mysql = require('mysql');

module.exports.getTweets = function () {
  var connection = getConnection();
  connection.connect();
  // Make regexes containing each search term, separated by '|'s
  var regexPlayer = '';
  var regexTeam = '';
  var regexAuthor = '';
  // Do retrieval here, using boolean operators in query consruction.
  // Note: need to check which fields should be used
  connection.query({
    sql: `SELECT * FROM tweets WHERE Content REGEXP %`,
    timeout: 40000, // 40s
    values: [regexPlayer, regexTeam, regexAuthor]
  }, function (error, results, fields) {
    if (error) throw error;
    if (results) console.log(results);
    if (fields) console.log(fields);
  });

  connection.end();
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
  for (var indx in tweets.statuses) {
    var tweet = tweets.statuses[indx];
    insTweet(tweet, connection);
  }
  connection.end();
};

function insTweet (tweet, conn) {
  var time = moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').format('YYYY-MM-DD HH:mm:ss');
  var text = tweet.text;
  // console.log(time);
  conn.query({
    sql: 'INSERT INTO tweets (Tweet_ID, Author, Datetime, Content) VALUES (?, ?, ?, ?)  ON DUPLICATE KEY UPDATE Tweet_ID=Tweet_ID',
    timeout: 40000, // 40s
    values: [tweet.id, tweet.user.screen_name, time, text]
  }, function (error, results, fields) {
    if (error) throw error;
    if (results) console.log(results);
    if (fields) console.log(fields);
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
      charset: 'utf8mb4'
    }
  );
  return connection;
}
