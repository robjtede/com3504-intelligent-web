'use strict';

var express = require('express');
var app = express(); // Express init

// Setup pug templating engine
app.set('views', './views');
app.set('view engine', 'pug');

app.use(express.static('./public')); // Static file serving

require('./routes/index')(app); // Express routing

// Start server
var port = process.env.PORT || 3000;
var server = app.listen(port, function () {
  console.log('Started server on port: ' + port);
});

// Socket.io setup
var io = require('socket.io')(server);
require('./io')(io);
