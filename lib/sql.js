'use strict';

const db = require('../config.json').db;

var mysql = require('mysql');

module.exports.insertTweet = function (tweet) {
  // doQuery();
};

function doQuery (q) {
  var connection = mysql.createConnection(
    {
      host: db.host,
      port: db.port,
      user: db.root,
      password: db.pass,
      database: db.name
    }
  );
  connection.connect();

  var query = connection.query('SELECT * FROM tweets');

  query.on('error', function (err) {
    throw err;
  });

  query.on('fields', function (fields) {
    console.log(fields);
  });

  query.on('result', function (row) {
    console.log(row);
  });

  connection.end();
}
