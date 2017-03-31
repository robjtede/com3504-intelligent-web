'use strict';

const keys = require('../config.json').twitter;
const moment = require('moment'); // Used for converting datetime

var Twit = require('twit');
var T = new Twit({
  consumer_key: keys.api_key,
  consumer_secret: keys.api_secret,
  access_token: keys.access_key,
  access_token_secret: keys.access_secret,
  timeout_ms: 60 * 1000
});

module.exports.stream = function (querySet, callback) {
  // Get stream of public tweets
  // Arrays of players and teams
  var players = querySet.player.replace(/\s+/g, '').split(',');
  var teams = querySet.team.replace(/\s+/g, '').split(',');
  // Remove spaces from authors to track
  var authors = querySet.author.replace(/\s+/g, '');
  // Construct track query
  var trackQuery = '';
  // Make series of statements of every combination of players + teams
  if (players[0] && teams[0]) {
    for (var p in players) {
      for (var t in teams) {
        trackQuery += players[p] + ' ' + teams[t] + ',';
      }
    }
  } else if (players[0]) {
    for (var pl in players) {
      trackQuery += players[pl];
    }
  } else if (teams[0]) {
    for (var tm in teams) {
      trackQuery += teams[tm];
    }
  }
  // Construct query
  var finalQuery = {};
  if (trackQuery) finalQuery['track'] = trackQuery;
  if (authors) finalQuery['follow'] = authors;
  // Execute query
  if (finalQuery) {
    console.log('Stream opened for ');
    console.log(finalQuery);
    var tweetStream = T.stream('statuses/filter', finalQuery);
    tweetStream.on('tweet', callback); // callback function with tweet param
  }
};

module.exports.search = function (querySet) {
  // Get each query, surround with parentheses
  var qPlayer = '(' + querySet.player + ')';
  var qTeam = '(' + querySet.team + ')';
  var qAuthor = querySet.author; // TODO: find author correctly
  // Replace occurences of commas with OR, for sub-queries
  qPlayer = qPlayer.replace(/,/g, ' OR ');
  qTeam = qTeam.replace(/,/g, ' OR ');
  qAuthor = qAuthor.replace(/,/g, ' OR from:').replace(/@/g, '');
  // Merge queries
  var finalQuery = qPlayer + ' AND ' + qTeam + ' AND (from:' + qAuthor + ')';
  console.log(finalQuery);

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
