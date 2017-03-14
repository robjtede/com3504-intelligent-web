'use strict';

const express = require('express');

const app = express();

app.set('views', './views');
app.set('view engine', 'pug');

app.get('/', function (req, res) {
  res.render('index', {
    title: 'COM3504'
  });
});

const port = process.env.PORT || 3000;

app.listen(port);
console.log(`Starting express server on port: ${port}`);
