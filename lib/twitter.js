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

module.exports.stream = function (querySet, callback) {
  // Get stream of public tweets
  // Arrays of players and teams
  var players = querySet.terms_player.replace(/\s+/g, '').split(',');
  var teams = querySet.terms_team.replace(/\s+/g, '').split(',');
  // Remove spaces from authors to track
  var authors = querySet.terms_author.replace(/\s+/g, '');
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
    console.log('Stream opened for ', finalQuery);
    var tweetStream = T.stream('statuses/filter', finalQuery);

    return tweetStream;
  }
};

module.exports.search = function (querySet) {
  // Get each query, surround with parentheses
  var qPlayer = '(' + querySet.terms_player + ')';
  var qTeam = '(' + querySet.terms_team + ')';
  var qAuthor = querySet.terms_author; // TODO: find author correctly
  // Replace occurences of commas with OR, for sub-queries
  qPlayer = qPlayer.replace(/,/g, ' OR ');
  qTeam = qTeam.replace(/,/g, ' OR ');
  qAuthor = qAuthor.replace(/,/g, ' OR from:').replace(/@/g, '');
  // Merge queries
  var finalQuery = qPlayer + ' AND ' + qTeam;
  if (qAuthor) { finalQuery = finalQuery + ' AND (from:' + qAuthor + ')'; }
  // Date (1 week ago) in yyyy-mm-dd format
  var dateStr = moment().subtract(7, 'days').format('YYYY-MM-DD');
  finalQuery = finalQuery + ' since:' + dateStr;
  console.log(finalQuery);

  return T.get('search/tweets', {
    q: finalQuery,
    count: 500,
    lang: 'en',
    since_id: querySet.newest_stored_tweet
  }).then(function (data) {
    var resp = data.resp;
    data = data.data;
    var maxId = data.search_metadata.max_id; // Newest tweet
    var nextQuery = data.search_metadata.next_results;
    console.log(data.search_metadata);
    console.log('Max ID: ' + maxId);
    console.log('Next results: ' + nextQuery);
    var simplified = data.statuses.map(function (tweet) {
      return simplifyTweet(tweet);
    });
    // TODO store max id in searches table

    // console.log(simplified);
    // TODO fix recursion
    /*
    var parsedNextQuery = querystring.parse(nextQuery.slice(1));
    var maxIdNextQuery = parsedNextQuery.max_id;

    if (maxIdNextQuery) {
      // Append next set of tweets to simplified.
      console.log('Beginning recursion');
      var newsimp = getTweetsStep(finalQuery, maxIdNextQuery, querySet.newest_stored_tweet, simplified.length);

      console.log('First page:');
      console.log(simplified);
      console.log('Next page:');
      console.log(newsimp);

      // simplified = simplified.concat(newsimp);
    }
    */
    return {
      tweets: simplified,
      maxTweetId: maxId
    };
    // TODO return max tweet id
  }).catch(function (err) {
    console.error(err);
    throw err;
  });
};

function getTweetsStep (query, lastId, sinceId, retrievedTweets) {
  var queryParams = {
    q: query,
    count: 500,
    lang: 'en',
    max_id: lastId,
    since_id: sinceId
  };
  return T.get('search/tweets', queryParams).then(function (data) {
    data = data.data;
    var maxId = data.search_metadata.max_id;
    var simplified = data.statuses.map(function (tweet) {
      return simplifyTweet(tweet);
    });
    // console.log(simplified);
    var numRetrieved = simplified.length + retrievedTweets;
    /*
    // TODO check number of steps (for api call limit, TWITTER_LIMIT)
    if (maxId || numRetrieved < TARGET_TWEETS) {
      // Append next set of tweets to simplified.
      console.log('Recursing again...');
      simplified += getTweetsRecurse(query, maxId, simplified.length);
    }
    */
    return simplified;
  }).catch(function (err) {
    console.error(err);
    throw err;
  });
}

function simplifyTweet (tweet) {
  return {
    tweet_id: tweet.id,
    author: tweet.user.screen_name,
    datetime: moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').format('YYYY-MM-DD HH:mm:ss'),
    content: tweet.text
  };
}
