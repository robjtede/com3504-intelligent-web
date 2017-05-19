'use strict';

var keys = require('../config.json').twitter;
var moment = require('moment'); // Used for converting datetime
var querystring = require('querystring'); //

var Twit = require('twit');
var T = new Twit({
  consumer_key: keys.api_key,
  consumer_secret: keys.api_secret,
  access_token: keys.access_key,
  access_token_secret: keys.access_secret,
  timeout_ms: 60 * 1000
});

var TARGET_TWEETS = 300; // Target no. of tweets to obtain in GET request.
var TWITTER_LIMIT = 15; // Limit of API calls, every 15 minutes

function stream (querySet, callback) {
  // Get stream of public tweets
  // Arrays of players and teams
  var players = querySet.terms_player.replace(/\s+/g, '').split(',');
  var teams = querySet.terms_team.replace(/\s+/g, '').split(',');
  // Remove spaces from authors to track
  var authors = querySet.terms_author.replace(/\s+/g, '');
  // Construct track query
  var trackQuery = '';

  // Select search mode
  var isAndMode = false;
  if (querySet.search_mode === 'AND') isAndMode = true;
  if (isAndMode) {
    // AND search
    // Make series of statements of every combination of players + teams
    if (players[0] && teams[0]) {
      for (var p in players) {
        for (var t in teams) {
          trackQuery += players[p] + ' ' + teams[t] + ',';
        }
      }
    } else if (players[0]) {
      for (var pl in players) {
        trackQuery += players[pl] + ',';
      }
    } else if (teams[0]) {
      for (var tm in teams) {
        trackQuery += teams[tm] + ',';
      }
    }
  } else {
    // OR search
    // Simply comma separate every single term
    if (players[0]) {
      for (var pIndex in players) {
        trackQuery += players[pIndex] + ',';
      }
    }
    if (teams[0]) {
      for (var tIndex in teams) {
        trackQuery += teams[tIndex] + ',';
      }
    }
  }
  // Remove last comma from string
  trackQuery = trackQuery.substring(0, trackQuery.lastIndexOf(','));
  // Construct query
  var finalQuery = {};
  if (trackQuery) finalQuery['track'] = trackQuery;
  if (authors) finalQuery['follow'] = authors;

  // Execute query
  if (finalQuery) {
    console.log('Stream opened for ', finalQuery);
    var tweetStream = T.stream('statuses/filter', finalQuery);

    return tweetStream;
  }
};

function search (querySet) {
  // Get each query, surround with parentheses
  var qPlayer = '(' + querySet.terms_player + ')';
  var qTeam = '(' + querySet.terms_team + ')';
  var qAuthor = querySet.terms_author; // TODO: find author correctly

  // Replace occurences of commas with OR, for sub-queries
  qPlayer = qPlayer.replace(/,/g, ' OR ');
  qTeam = qTeam.replace(/,/g, ' OR ');
  qAuthor = qAuthor.replace(/,/g, ' OR from:').replace(/@/g, '');

  // Merge queries
  var mergeStr = ' OR ';
  if (querySet.search_mode === 'AND') mergeStr = ' AND ';

  // TODO use search table's mode (ie querySet.search_mode)
  var query = qPlayer + mergeStr + qTeam;
  if (qAuthor) query += mergeStr + '(from:' + qAuthor + ')';

  // Date (1 week ago) in yyyy-mm-dd format
  var dateStr = moment().subtract(7, 'days').format('YYYY-MM-DD');

  query += ' since:' + dateStr;
  console.log(query);

  var cache = [];

  return T.get('search/tweets', {
    q: query,
    count: TARGET_TWEETS,
    lang: 'en',
    since_id: querySet.newest_stored_tweet
  }).then(function (data) {
    var resp = data.resp;
    data = data.data;

    // TODO fix bug on no search
    if (data.search_metadata) {
      // TODO store max id in searches table
      // Newest tweet in string form because 64-bit
      var maxId = data.search_metadata.max_id_str;
      var nextQuery = data.search_metadata.next_results;

      var simplified = data.statuses.map(simplifyTweet);

      if (nextQuery) {
        var parsedNextQuery = querystring.parse(nextQuery.slice(1));

        Array.prototype.push.apply(cache, simplified);

        return getTweetsStep(parsedNextQuery, TARGET_TWEETS, cache);
      } else {
        return {
          tweets: simplified,
          maxTweetId: maxId
        };
      }
    } else {
      // No search made
      // TODO handle
    }
  }).catch(function (err) {
    console.error(err);
    throw err;
  });
};

function getTweetsStep (query, tweetsToRetrieve, cache) {
  if (tweetsToRetrieve > 0) {
    console.log('tweet step:', query);

    return T.get('search/tweets', query)
      .then(function (data) {
        var resp = data.resp;
        data = data.data;

        var count = data.statuses.length;
        var nextQuery = data.search_metadata.next_results;

        var simplified = data.statuses.map(simplifyTweet);

        Array.prototype.push.apply(cache, simplified);

        if (nextQuery) {
          var parsedNextQuery = querystring.parse(nextQuery.slice(1));

          return getTweetsStep(parsedNextQuery, tweetsToRetrieve - count, cache);
        }
      });
  } else {
    return {
      tweets: cache
    };
  }
}

function simplifyTweet (tweet) {
  return {
    tweet_id: tweet.id,
    author: tweet.user.screen_name,
    datetime: moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').format('YYYY-MM-DD HH:mm:ss'),
    content: tweet.text
  };
}

module.exports = {
  search: search,
  stream: stream
};
