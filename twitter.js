'use strict';
const keys = require('./config.json').twitter;
var Twit = require('twit');
var T = new Twit({
  consumer_key: keys.api_key,
  consumer_secret: keys.api_secret,
  access_token: keys.access_key,
  access_token_secret: keys.access_secret
});

function search (query, cb) {
  T.get('search/tweets', {q: query},
    function (err, data, response) {
      if (err) console.error(err);
      for (var index in data.statuses) {
        var tweet = data.statuses[index];
        console.log('on: ' + tweet.created_at + ' : @' + tweet.user.screen_name + ' : ' + tweet.text + '\n\n');
      }
      cb(data);
    });
}
