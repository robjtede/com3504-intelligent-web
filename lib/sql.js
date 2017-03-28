'use strict';

const db = require('../config.json').db;
const moment = require('moment'); // Used for converting datetime

var mysql = require('mysql');

module.exports.insertTweet = function (tweet) {
  var time = moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').format('YYYY-MM-DD HH:MM:SS');
  var text = tweet.text;
  console.log(time);
  var conn = getConnection();
  conn.connect();

  conn.query({
    sql: 'INSERT INTO tweets (Tweet_ID, Author, Datetime, Content) VALUES (?, ?, ?, ?)',
    timeout: 40000, // 40s
    values: [tweet.id, tweet.user.screen_name, time, text]
  }, function (error, results, fields) {
    if (error) throw error;
    if (results) console.log(results);
    if (fields) console.log(fields);
  });

  conn.end();
};

function getConnection () {
  var connection = mysql.createConnection(
    {
      host: db.host,
      port: db.port,
      user: db.user,
      password: db.pass,
      database: db.name
    }
  );
  return connection;
}
