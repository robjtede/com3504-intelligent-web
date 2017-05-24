'use strict';

var db = require('../config.json').db;

var moment = require('moment');
var Promise = require('any-promise');
var mysql = require('mysql');

var getTweets = function (id) {
  var sqlQuery = 'SELECT * FROM tweets WHERE searches_id = ?';

  return query(sqlQuery, [id])
    .then(function (resultsµ) {
      return results.map(function (tweet) {
        return {
          tweetId: tweet.tweet_id,
          author: tweet.author,
          datetime: tweet.datetime,
          datetime_human: formatDate(tweet.created_at, true),
          content: tweet.content,
          avatarUrl: tweet.avatar_url,
          name: tweet.real_name
        };
      });
    });
};

// only call if tweets.length > 0
function insertTweetMulti (tweets, searchId) {
  var sqlQuery = 'INSERT INTO tweets ' +
                 '(tweet_id, author, datetime, content, searches_id, avatar_url, real_name) VALUES ';

  var valuesStr = [];
  var values = [];

  tweets.forEach(function (tweet) {
    var time = tweet.datetime;
    var text = tweet.content;

    valuesStr.push('(?, ?, ?, ?, ?, ?, ?)');
    Array.prototype.push.apply(values, [tweet.tweetId, tweet.author, time, text, searchId, tweet.avatarUrl, tweet.name]);
  });

  sqlQuery += valuesStr.join(',');
  // sqlQuery += ' ON DUPLICATE KEY UPDATE tweet_id=tweet_id';

  return query(sqlQuery, values);
};

function insertTweet (tweet, searchId) {
  var time = tweet.datetime;
  var text = tweet.content;

  var sqlQuery = 'INSERT INTO tweets ' +
  '(tweet_id, author, datetime, content, searches_id, avatar_url, real_name) ' +
  'VALUES (?, ?, ?, ?, ?, ?, ?) '; // +
  // 'ON DUPLICATE KEY UPDATE tweet_id=tweet_id';

  return query(sqlQuery, [tweet.tweetId, tweet.author, time, text, searchId, tweet.avatarUrl, tweet.name]);
};

function addSearch (termPlayer, termTeam, termAuthor, isAnd) {
  var modeStr = isAnd ? 'AND' : 'OR';
  var sqlQuery = 'INSERT INTO searches (player, team, author, mode) VALUES (?, ?, ?, ?)';

  return query(sqlQuery, [termPlayer, termTeam, termAuthor, modeStr]);
};

function newSearch (q, isAnd) {
  // Create a new search / tracking, after checking it doesn't already exist.
  // return the id of the already present or new search
  // TODO improve tracking matching, and reintroduce
  /*
  return getSearch(q, isAnd)
    .then(function (results) {
      if (results.length === 0) {
        // No existing search exists, make a new one
        return addSearch(q.player, q.team, q.author, isAnd)
          .then(function (results) {
            console.log('new search');
            return results.insertId;
          });
      } else {
        // TODO detection regularly fails
        // Existing search exists - callback old id
        console.log('existing search');
        return results[0].id;
      }
    });
    */

  return addSearch(q.player, q.team, q.author, isAnd)
      .then(function (results) {
        return results.insertId;
      });
}

function getSearch (querySet, isAnd) {
  // NOTE unused, due to limited functionality, and false positives
  // currently matches against more specific searches
  // TODO only get searches where ALL and ONLY subqueries are present
  // Remove spaces from queries, and split into regexes by
  // replacing commas with pikes (|).
  // Also remove '@' from author, as this is implied by comparing to 'Author'.
  var qPlayer = querySet.player.replace(/\s+/g, '');
  var qTeam = querySet.team.replace(/\s+/g, '');
  var qAuthor = querySet.author.replace(/\s+/g, '').replace(/@/g, '');

  var sqlPlayer = '';
  var sqlTeam = '';
  var sqlAuthor = '';

  // For empty queries, use regexps with '^$' to match only empty columns
  // https://www.toadworld.com/platforms/mysql/w/wiki/6550.pattern-matching-and-cast-operators
  // Otherwise, construct series of ANDed regexes to match every subquery
  if (qPlayer === '') {
    sqlPlayer = 'player REGEXP "^$" ';
  } else {
    // TODO successfully matches against where all are present - but not where ONLY terms are present
    var qsPlayer = qPlayer.split(',');
    sqlPlayer = 'player REGEXP ' + mysql.escape(qsPlayer[0].trim()) + ' ';
    if (qsPlayer.length > 1) {
      for (var p = 1; p < qsPlayer.length; p++) {
        var currPlyrTerm = qsPlayer[p].trim();
        sqlPlayer += 'AND player REGEXP ' + mysql.escape(currPlyrTerm) + ' ';
      }
    }
  }
  if (qTeam === '') {
    sqlTeam = 'team REGEXP "^$" ';
  }
  // TODO do same for team as in player
  if (qAuthor === '') {
    sqlAuthor = 'author REGEXP "^$" ';
  }
  // TODO do same for author as in player

  // AND / OR checking
  var modeStr = isAnd ? 'AND' : 'OR';

  // Do retrieval here, using boolean operators in query consruction.
  var sqlQuery = 'SELECT * FROM searches ' +
                 'WHERE ' + sqlPlayer +
                 'AND ' + sqlTeam +
                 'AND ' + sqlAuthor +
                 'AND mode = ?';

  console.log(sqlQuery);

  return query(sqlQuery, [modeStr])
    .then(function (results) {
      return results.map(function (search) {
        return {
          id: search.id,
          newestTweet: search.newestTweet
        };
      });
    });
};

function getSearchTermsFromId (id) {
  var sqlQuery = 'SELECT * FROM searches WHERE id = ?';

  return query(sqlQuery, [id])
    .then(function (results) {
      return results.map(function (search) {
        return {
          terms_player: search.player,
          terms_team: search.team,
          terms_author: search.author,
          search_mode: search.mode,
          newest_stored_tweet: search.newestTweet
        };
      });
    });
}

function updateSearchNewestTweet (id, newestTweetId) {
  var sqlQuery = 'UPDATE searches ' +
                 'SET newestTweet = ? ' +
                 'WHERE id = ?';

  return query(sqlQuery, [newestTweetId, id]);
}

function getSearchList () {
  var sqlQuery = 'SELECT * FROM searches ORDER BY id DESC';

  return query(sqlQuery);
}

function query (query, params, conn) {
  if (!conn) conn = getConnection();

  return new Promise(function (resolve, reject) {
    conn.query({
      sql: query,
      values: params,
      timeout: 40000
    }, function (error, results, fields) {
      conn.end();
      if (error) reject(new Error(error));

      resolve(results);
    });
  });
}

function getPlayerRealName (screenName) {
  // Get player's real name from manually stored Twitter handle (screenname)
  var sqlQuery = 'SELECT * FROM players WHERE screen_name = ?';
  return query(sqlQuery, [screenName]);
}

function getConnection () {
  return mysql.createConnection({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.pass,
    database: db.name,
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true
  });
}

function getSearchesTable () {
	var sqlQuery = 'SELECT * FROM searches';

  return query(sqlQuery)
    .then(function (results) {
      return results.map(function (search) {
        return {
          terms_player: search.player,
          terms_team: search.team,
          terms_author: search.author,
          search_mode: search.mode,
          newest_stored_tweet: search.newestTweet
        };
      });
    });
}

function getTweetsTable () {
	var sqlQuery = 'SELECT * FROM tweets';

	return query(sqlQuery)
    .then(function (results) {
      return results.map(function (tweet) {
        return {
          tweet_id: tweet.tweet_id,
          author: tweet.author,
          datetime: tweet.datetime,
          content: tweet.content,
		  searchesID: tweet.searches_id
        };
      });
    });

function formatDate (date, human) {
  var fmt = human
    ? 'h:mm A - D MMM YYYY'
    : 'YYYY-MM-DD HH:mm:ss';

  return moment(date).format(fmt);
}

module.exports = {
  getConnection: getConnection,
  query: query,
  getTweets: getTweets,
  insertTweet: insertTweet,
  insertTweetMulti: insertTweetMulti,
  addSearch: addSearch,
  getSearch: getSearch,
  getSearchFromId: getSearchTermsFromId,
  updateSearchNewestTweet: updateSearchNewestTweet,
  newSearch: newSearch,
  getSearchList: getSearchList,
  getPlayerRealName: getPlayerRealName,
  getTweetsTable: getTweetsTable,
  getSearchesTable: getSearchesTable
};
