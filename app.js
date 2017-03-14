'use strict';

const express = require('express');

const app = express();

const twitter = require('./twitter.js');

app.set('views', './views');
app.set('view engine', 'pug');

app.get('/', function (req, res) {
  twitter.search('#football', function (data) {
    res.render('index', {
      title: 'COM3504',
      tweets: data
    });
  });
});

const port = process.env.PORT || 3000;

app.listen(port);
console.log(`Starting express server on port: ${port}`);
