'use strict';

var moment = require('moment');
var twitter = require('./lib/twitter');
var sql = require('./lib/sql');
var dbp = require('./lib/dbpedia');

function getCachedTweets (socket, trackingId) {
  // Get stored tweets
  return sql.getTweets(trackingId)
    .then(function (results) {
      // Send tweets to client
      socket.emit('cachedTweets', results);

      // Send frequencies to client
      socket.emit('getTweetFrequency', series(results.reduce(groupTweet, {})));
    });
}

function getRemoteTweets (socket, q, searchId) {
  return twitter
    .search(q)
    .then(function (data) {
      var tweets = data.tweets;
      var maxTweetId = data.maxTweetId;

      // Add max tweet id to tracking (search)
      if (maxTweetId) sql.updateSearchNewestTweet(searchId, maxTweetId);

      if (tweets.length) {
        // Insert new tweets into database
        sql.insertTweetMulti(tweets, searchId)
          .catch(function (err) {
            console.error(err);
          });

        // Send dates to page
        socket.emit('getRemoteTweets', tweets);

        // count per day frequency
        socket.emit('getTweetFrequency', series(tweets.reduce(groupTweet, {})));
      }
    });
}

// Socket connection
module.exports = function (io) {
  io.on('connection', function (socket) {
    console.log('connected', socket.id);

    // Add new tracking (search)
    socket.on('newTracking', function (client) {
      // Read client's input data
      if (client.player || client.team || client.author) {
        // isAnd refers to the checkbox for AND/OR mode
        // enabled = AND, OR otherwise (including if no field present)
        var isAndMode = false;
        if (client.isAnd) {
          isAndMode = true;
        };

        sql.newSearch(client, isAndMode)
          .then(function (searchId) {
            console.log('Tracking ID created or existing found: ' + searchId);
            socket.emit('NewTrackingID', searchId);
          })
          .catch(function (err) {
            console.error(err);
          });
      }
    });

    // Get list of every tracking (search) present in database.
    // NOTE: a tracking's id can be used passed into the client's "trackingId"
    //        field for the socket "join" event to get its tweets
    socket.on('getTrackingsList', function (client) {
      sql.getSearchList()
        .then(function (results) {
          if (results[0]) {
            // Has results
            socket.emit('serverTrackingsList', results);
          }
        })
        .catch(function (err) {
          console.error(err);
        });
    });

    socket.on('requestRemoteTweets', function (client) {
      var searchId = client.trackingId;
      console.log('SOCKET GET REMOTE WITH ID: ' + searchId);

      sql.getSearchFromId(searchId)
        .then(function (results) {
          var q = results[0];
          if (q) {
            // Now retrieve more tweets from twitter, and add to page
            getRemoteTweets(socket, q, searchId)
              .catch(function (err) {
                console.error(err);
              });

            // Start streaming tweets
            // Now listen to stream, adding to page as received
            var tweetStream = twitter.stream(q);

            tweetStream.on('tweet', function (tweet) {
              // Format tweet for consistency
              var formattedTweet = {
                tweetId: tweet.id_str,
                author: tweet.user.screen_name,
                datetime: formatDate(tweet.created_at),
                datetime_human: formatDate(tweet.created_at, true),
                content: tweet.text,
                avatarUrl: tweet.user.profile_image_url,
                name: tweet.user.name
              };

              // Insert into db
              sql.insertTweet(formattedTweet, searchId)
                .then(function (err) {
                  console.error(err);
                });

              // update max id of search
              sql.updateSearchNewestTweet(searchId, formattedTweet.tweet_id)
                .catch(function (err) {
                  console.error(err);
                });

              // Send tweet to page
              socket.emit('streamedTweet', formattedTweet);
            });

            // check disconnected socket
            socket.on('disconnect', function () {
              console.log('User disconnected.');
              tweetStream.stop();
            });

            socket.on('disconnectCordova', function () {
              console.log('Stream closed');

              tweetStream.stop();
            });
          } else {
            // No tracking (search) found
            // TODO handle
          }
        });
    });

    // Standard client connection
    socket.on('join', function (client) {
      var searchId = client.trackingId;

      sql.getSearchFromId(searchId)
        .then(function (results) {
          var q = results[0];
          if (q) {
            // Search found, start sending tweets to client
            // Initialise set to track existing ids (prevent duplicate tweets)

            // Get tweets from database
            getCachedTweets(socket, searchId)
              .catch(function (err) {
                console.error(err);
              });

            dbp.findPlayer(socket, q);
          } else {
            // No search, invalid id or error
            // TODO handle
          }
        })
        .catch(function (err) {
          console.error(err);
        });
    });

    socket.on('getTableSearches', function () {
      sql.getSearchesTable().then(function (results) {
        if (results) {
          socket.emit('tableSearches', results);
        }
      });
    });

    socket.on('getTableTweets', function () {
      sql.getTweetsTable().then(function (results) {
        if (results) {
          socket.emit('tableTweets', results);
        }
      });
    });

    socket.on('getlocalCachedTweets', function (id) {
      console.log('getlocal');
      socket.emit('localCachedTweets', id);
    });
  });
};

function formatDate (date, human) {
  var fmt = human
    ? 'h:mm A - D MMM YYYY'
    : 'YYYY-MM-DD HH:mm:ss';

  return moment(
    date,
    'dd MMM DD HH:mm:ss ZZ YYYY',
    'en'
  ).format(fmt);
}

function groupTweet (days, tweet) {
  var sod = moment(tweet.datetime).startOf('day');

  if (sod in days) days[sod]++;
  else days[sod] = 1;

  return days;
}

function series (groups) {
  var series = [];

  for (var day in groups) {
    if (groups.hasOwnProperty(day)) {
      series.push({
        day: new Date(day),
        num: groups[day]
      });
    }
  }

  var zeroWeek = [0, 1, 2, 3, 4, 5, 6].map(function (n) {
    var startOfDay = moment().subtract(n, 'days').startOf('day');

    return {
      day: new Date(startOfDay),
      num: 0
    };
  });

  zeroWeek.forEach(function (zeroDay) {
    var exists = false;

    series.forEach(function (day) {
      if (exists) return;

      if (+zeroDay.day === +day.day) exists = true;
      else exists = false;
    });

    if (!exists) series.push(zeroDay);
  });

  series = series.sort(function (a, b) {
    return a.day < b.day ? -1 : 1;
  }).reverse().slice(0, 7).reverse();

  return series;
}
