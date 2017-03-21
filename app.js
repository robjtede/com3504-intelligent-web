'use strict';

const express = require('express');

const app = express();

app.set('views', './views');
app.set('view engine', 'pug');

require('./routes/index')(app);

const port = process.env.PORT || 3000;

app.listen(port);
console.log(`Starting express server on port: ${port}`);
