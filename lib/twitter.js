'use strict';

const keys = require('../config.json').twitter;

var Twit = require('twit');
var T = new Twit({
  consumer_key: keys.api_key,
  consumer_secret: keys.api_secret,
  access_token: keys.access_key,
  access_token_secret: keys.access_secret,
  timeout_ms: 60 * 1000
});

module.exports.search = function (query) {
  return T.get('search/tweets', {
    q: query,
    count: 500
  }).then(function ({data, resp}) {
    return data;
  }).catch(err => {
    console.error(err);
    throw err;
  });
};
