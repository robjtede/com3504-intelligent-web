'use strict';

const keys = require('../config.json').twitter;
const moment = require('moment'); // Used for converting datetime

var sql = require('./sql.js');

var Twit = require('twit');
var T = new Twit({
  consumer_key: keys.api_key,
  consumer_secret: keys.api_secret,
  access_token: keys.access_key,
  access_token_secret: keys.access_secret,
  timeout_ms: 60 * 1000
});

module.exports.publicStream = function (query) {
  // Stream public tweets here
  // Insert tweet into db
  // Return single tweet, for adding to webpage
};

module.exports.search = function (querySet) {
  // Get each query, surround with parentheses
  var qPlayer = '(' + querySet.player + ')';
  var qTeam = '(' + querySet.team + ')';
  var qAuthor = '(' + querySet.author + ')'; // TODO: find author correctly
  // Replace occurences of commas with OR, for sub-queries
  qPlayer = qPlayer.replace(/,/g, ' OR ');
  qTeam = qTeam.replace(/,/g, ' OR ');
  qAuthor = qAuthor.replace(/,/g, ' OR ');
  // Merge queries
  var finalQuery = qPlayer + ' AND ' + qTeam + ' AND ' + qAuthor;
  // console.log(finalQuery);

  return T.get('search/tweets', {
    q: finalQuery,
    count: 500,
    lang: 'en'
  }).then(function ({data, resp}) {
    // console.log(data);
    return data.statuses.map(function (tweet) {
      return {
        tweet_id: tweet.id,
        author: tweet.user.screen_name,
        datetime: moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').format('YYYY-MM-DD HH:mm:ss'),
        content: tweet.text
      };
    });
  }).catch(err => {
    console.error(err);
    throw err;
  });
};
