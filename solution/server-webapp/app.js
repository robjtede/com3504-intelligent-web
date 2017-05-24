'use strict';

// Register promise library with any promise
require('any-promise/register')('bluebird', { Promise: require('bluebird') });

// Express init
var express = require('express');
var app = express();

// Setup pug templating engine
app.set('views', './views');
app.set('view engine', 'pug');

// Static file serving
app.use(express.static('./public'));

// Express routing
require('./routes/trackings')(app);

// Send 404 on missing file/route
app.use(function (req, res, next) {
  res.render('404');
});

// Start server
var port = process.env.PORT || 3000;
var server = app.listen(port, function () {
  console.log('Started server on port: ' + port);
});

// Socket.io setup
var io = require('socket.io')(server);
require('./io')(io);
