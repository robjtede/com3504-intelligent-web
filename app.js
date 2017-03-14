'use strict';

const express = require('express');

const app = express();

app.set('views', './views');
app.set('view engine', 'pug');

const port = process.env.PORT || 3000;

app.get('/', function (req, res) {
  res.render('index', {
    title: 'COM3504'
  });
});

app.listen(3000);
