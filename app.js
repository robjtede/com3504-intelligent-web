'use strict';

const express = require('express');
const app = express(); // Express init

// Setup pug templating engine
app.set('views', './views');
app.set('view engine', 'pug');

app.use(express.static('./public')); // Static file serving

require('./routes/index')(app); // Routing

// Socket.io setup
const http = require('http').Server(app);
const io = require('socket.io')(http);
// Start server
const port = process.env.PORT || 3000;
http.listen(port, function () {
  console.log('Started server on port: ' + port);
});

io.on('connection', function (socket) {
  console.log('User connected.');
  socket.on('disconnect', function () {
    console.log('User disconnected.');
  });
});
