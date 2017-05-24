'use strict';

var db = require('../config.json').db;

var moment = require('moment');
var Promise = require('any-promise');
var mysql = require('mysql');

/**
 * Gets all tweets for a given search/tracking
 * @param  {number}  id Search/tracking ID
 * @return {promise}    Resolves with query results
 */
var getTweets = function (id) {
  var sqlQuery =
    'SELECT * FROM tweets' +
    ' WHERE searches_id = ?' +
    ' ORDER BY tweet_id ASC';

  return query(sqlQuery, [id])
    .then(function (results) {
      return results.map(function (tweet) {
        return {
          tweetId: tweet.tweet_id,
          author: tweet.author,
          datetime: tweet.datetime,
          datetime_human: formatDate(tweet.datetime, true),
          content: tweet.content,
          avatarUrl: tweet.avatar_url,
          name: tweet.real_name
        };
      });
    });
};

/**
 * Adds multiple tweets to database
 * @param  {array}   tweets   Simplified Tweets objects list
 * @param  {number}  searchId Search/tracking ID
 * @return {promise}          Resolves with query results
 */
function insertTweetMulti (tweets, searchId) {
  if (!tweets.length) return Promise.reject(new Error('tweet list cannot be empty'));

  var sqlQuery =
    'INSERT INTO tweets' +
    ' (tweet_id, author, datetime, content, searches_id, avatar_url, real_name)' +
    ' VALUES ';

  var valuesStr = [];
  var values = [];

  tweets.forEach(function (tweet) {
    var time = tweet.datetime;
    var text = tweet.content;

    valuesStr.push('(?, ?, ?, ?, ?, ?, ?)');
    values.push(tweet.tweetId, tweet.author, time, text, searchId, tweet.avatarUrl, tweet.name);
  });

  sqlQuery += valuesStr.join(',');
  // sqlQuery += ' ON DUPLICATE KEY UPDATE tweet_id=tweet_id';

  return query(sqlQuery, values);
};

/**
 * Adds a single tweet to database
 * @param  {object}  tweet    Simplified Tweet object
 * @param  {number}  searchId Search/tracking ID
 * @return {promise}          Resolves with query results
 */
function insertTweet (tweet, searchId) {
  if (!tweet) return Promise.reject(new Error('tweet object not provided'));

  var time = tweet.datetime;
  var text = tweet.content;

  var sqlQuery = 'INSERT INTO tweets' +
  ' (tweet_id, author, datetime, content, searches_id, avatar_url, real_name)' +
  ' VALUES (?, ?, ?, ?, ?, ?, ?)';
  // sqlQuery += ' ON DUPLICATE KEY UPDATE tweet_id=tweet_id';

  return query(sqlQuery, [tweet.tweetId, tweet.author, time, text, searchId, tweet.avatarUrl, tweet.name]);
};

/**
 * Adds new search/tracking to database (without duplication checks)
 * @param  {string}  termPlayer Search/tracking player(s)
 * @param  {string}  termTeam   Search/tracking team(s)
 * @param  {string}  termAuthor Search/tracking author(s)
 * @param  {boolean} isAnd      Mode switch
 * @return {promise}            Resolves with query results
 */
function addSearch (termPlayer, termTeam, termAuthor, isAnd) {
  var modeStr = isAnd ? 'AND' : 'OR';
  var sqlQuery =
    'INSERT INTO searches' +
    ' (player, team, author, mode)' +
    ' VALUES (?, ?, ?, ?)';

  return query(sqlQuery, [termPlayer, termTeam, termAuthor, modeStr]);
};

/**
 * Add new search/tracking to database (with duplication checks)
 * @param  {object}  q     Search/tracking parameters
 * @param  {boolean} isAnd Mode switch
 * @return {promise}       Resolves with query results
 */
function newSearch (q, isAnd) {
  // // Create a new search / tracking, after checking it doesn't already exist.
  // // return the id of the already present or new search
  // // TO DO improve tracking matching, and reintroduce
  // return getSearch(q, isAnd)
  //   .then(function (results) {
  //     if (results.length === 0) {
  //       // No existing search exists, make a new one
  //       return addSearch(q.player, q.team, q.author, isAnd)
  //         .then(function (results) {
  //           console.log('new search');
  //           return results.insertId;
  //         });
  //     } else {
  //       // TO DO detection regularly fails
  //       // Existing search exists - callback old id
  //       console.log('existing search');
  //       return results[0].id;
  //     }
  //   });

  return addSearch(q.player, q.team, q.author, isAnd)
    .then(function (results) {
      return results.insertId;
    });
}

// function getSearch (querySet, isAnd) {
//   // NOTE unused, due to limited functionality, and false positives
//   // currently matches against more specific searches
//   // TO DO only get searches where ALL and ONLY subqueries are present
//   // Remove spaces from queries, and split into regexes by
//   // replacing commas with pikes (|).
//   // Also remove '@' from author, as this is implied by comparing to 'Author'.
//   var qPlayer = querySet.player.replace(/\s+/g, '');
//   var qTeam = querySet.team.replace(/\s+/g, '');
//   var qAuthor = querySet.author.replace(/\s+/g, '').replace(/@/g, '');
//
//   var sqlPlayer = '';
//   var sqlTeam = '';
//   var sqlAuthor = '';
//
//   // For empty queries, use regexps with '^$' to match only empty columns
//   // https://www.toadworld.com/platforms/mysql/w/wiki/6550.pattern-matching-and-cast-operators
//   // Otherwise, construct series of ANDed regexes to match every subquery
//   if (qPlayer === '') {
//     sqlPlayer = 'player REGEXP "^$" ';
//   } else {
//     // TO DO successfully matches against where all are present - but not where ONLY terms are present
//     var qsPlayer = qPlayer.split(',');
//     sqlPlayer = 'player REGEXP ' + mysql.escape(qsPlayer[0].trim()) + ' ';
//     if (qsPlayer.length > 1) {
//       for (var p = 1; p < qsPlayer.length; p++) {
//         var currPlyrTerm = qsPlayer[p].trim();
//         sqlPlayer += 'AND player REGEXP ' + mysql.escape(currPlyrTerm) + ' ';
//       }
//     }
//   }
//   if (qTeam === '') {
//     sqlTeam = 'team REGEXP "^$" ';
//   }
//   // TO DO do same for team as in player
//   if (qAuthor === '') {
//     sqlAuthor = 'author REGEXP "^$" ';
//   }
//   // TO DO do same for author as in player
//
//   // AND / OR checking
//   var modeStr = isAnd ? 'AND' : 'OR';
//
//   // Do retrieval here, using boolean operators in query consruction.
//   var sqlQuery =
//     'SELECT * FROM searches ' +
//     'WHERE ' + sqlPlayer +
//     'AND ' + sqlTeam +
//     'AND ' + sqlAuthor +
//     'AND mode = ?';
//
//   console.log(sqlQuery);
//
//   return query(sqlQuery, [modeStr])
//     .then(function (results) {
//       return results.map(function (search) {
//         return {
//           id: search.id,
//           newestTweet: search.newestTweet
//         };
//       });
//     });
// };

/**
 * Get single search from database
 * @param  {number}  id Search/tracking ID
 * @return {promise}    Resolves with query results
 */
function getSearchTermsFromId (id) {
  var sqlQuery =
    'SELECT *' +
    ' FROM searches' +
    ' WHERE id = ?';

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

/**
 * Updates search/tracking newest Tweet ID in database
 * @param  {number}  id            Search/tracking ID
 * @param  {string}  newestTweetId New maximum Tweet ID for search/tracking
 * @return {promise}               Resolves with query results
 */
function updateSearchNewestTweet (id, newestTweetId) {
  var sqlQuery =
    'UPDATE searches' +
    ' SET newestTweet = ?' +
    ' WHERE id = ?';

  return query(sqlQuery, [newestTweetId, id]);
}

/**
 * Get searches/trackings list from database
 * @return {promise} Resolves with query results
 */
function getSearchList () {
  var sqlQuery =
    'SELECT *' +
    ' FROM searches' +
    ' ORDER BY id DESC';

  return query(sqlQuery);
}

/**
 * Get player's real name database
 * @param  {string} screenName Twitter handle
 * @return {promise}           Resolves with query results
 */
function getPlayerRealName (screenName) {
  var sqlQuery =
    'SELECT *' +
    ' FROM players' +
    ' WHERE screen_name = ?';

  return query(sqlQuery, [screenName]);
}

/**
 * Get entire searches/trackings table from database
 * @return {promise} Resolves with query results
 */
function getSearchesTable () {
  var sqlQuery =
    'SELECT * ' +
    'FROM searches';

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

/**
 * Get entire tweets table from database
 * @return {promise} Resolves with query results
 */
function getTweetsTable () {
  var sqlQuery =
    'SELECT *' +
    'FROM tweets';

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
}

/**
 * Promisified database query helper
 * @param  {string}  query  SQL query (including ? placeholders)
 * @param  {array}   params Placeholder values to be sanitised
 * @param  {object}  conn   Optional. MySQL connection object
 * @return {promise}        Resolves with query results
 */
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

/**
 * Creates new database connection pbject
 * @return {Object} MySQL connection object
 */
function getConnection () {
  return mysql.createConnection({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.pass,
    database: db.name,

    // to support emoji
    charset: 'utf8mb4',

    // to retrieve tweet_id BIGINTs as strings
    supportBigNumbers: true,
    bigNumberStrings: true
  });
}

/**
 * Formats date strings consistently
 * @param  {string}  date  Date string
 * @param  {boolean} human True for human readable
 * @return {string}        Formatted date string
 */
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
  // getSearch: getSearch,
  getSearchFromId: getSearchTermsFromId,
  updateSearchNewestTweet: updateSearchNewestTweet,
  newSearch: newSearch,
  getSearchList: getSearchList,
  getPlayerRealName: getPlayerRealName,
  getTweetsTable: getTweetsTable,
  getSearchesTable: getSearchesTable
};
