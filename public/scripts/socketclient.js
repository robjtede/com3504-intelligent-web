/* global io:false Chart:false */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var socket = io.connect();
  var pathname = window.location.pathname;

  var getRemoteButton = document.getElementById('remoteTweetsButton');
  if (getRemoteButton) {
    getRemoteButton.addEventListener('click', function () {
      if (pathname.substring(0, 16) === '/trackings/show/') {
        var trackIdStr = pathname.substring(16);
        var trackId = parseInt(trackIdStr);
        socket.emit('requestRemoteTweets', {
          path: pathname,
          trackingId: trackId
        });
        getRemoteButton.style.display = 'none';
      }
    });
  }

  socket.on('connect', function () {
    console.log('connected', socket.id);
    // Send query

    if (pathname.substring(0, 16) === '/trackings/show/') {
      var trackIdStr = pathname.substring(16);
      var trackId = parseInt(trackIdStr);
      socket.emit('join', {
        path: pathname,
        trackingId: trackId
      });
    }
  });

  // Add player profile info
  var playerProfileDiv = document.getElementById('playerProfile');
  if (playerProfileDiv) {
    socket.on('playerProfile', function (profileData) {
      var profileStr = '<div><p>' + profileData.name + '</p>' +
                        '<p>' + profileData.club + '</p>' +
                        '<p>' + profileData.position + '</p>' +
                        '<img src="' + profileData.imgUrl + '"' +
                        ' width="80px"> </div>';
      playerProfileDiv.innerHTML = profileStr + playerProfileDiv.innerHTML;
    });
  }

  // Got socket of tweets from database
  socket.on('cachedTweets', function (data) {
    console.log('got cached tweets');
    var tweetsDiv = document.getElementById('tweetList');
    var tweetsCount = document.getElementById('tweetCount');
    var addedTweets = '';

    for (var t in data) {
      var tweet = data[t];

      addedTweets += '<p> CACHED RESULT:</p>';
      addedTweets += makeTweetDiv(tweet);
    }

    tweetsDiv.innerHTML = addedTweets + tweetsDiv.innerHTML;
    tweetsCount.textContent = data.length;
  });

  // Got socket of tweets from get/search
  socket.on('getRemoteTweets', function (data) {
    console.log('got remote tweets');
    var tweetsDiv = document.getElementById('tweetList');
    var tweetsCount = document.getElementById('tweetCount');
    var addedTweets = '';

    for (var t in data) {
      var tweet = data[t];

      addedTweets += '<p> GET/SEARCH RESULT:</p>';
      addedTweets += makeTweetDiv(tweet);
    }
    tweetsDiv.innerHTML = addedTweets + tweetsDiv.innerHTML;
    tweetsCount.textContent = parseInt(tweetsCount.textContent) + data.length;
  });

  // Got socket of streamed tweet
  socket.on('streamedTweet', function (tweet) {
    var tweetsDiv = document.getElementById('tweetList');
    var addedTweet = '<p> STREAM RESULT:</p>';

    addedTweet += makeTweetDiv(tweet);
    tweetsDiv.innerHTML = addedTweet + tweetsDiv.innerHTML;
  });

  socket.on('getTweetFrequency', function (data) {
    console.log('got tweet frequency');
    var ctx = document.getElementById('myChart').getContext('2d');
      // Creates and draws the line chart using the data
    var myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Frequency',
          data: Object.values(data),
          fill: false
        }]
      },
      options: {
        responsive: false,
        scales: {
          yAxes: [{
            ticks: {
              fontColor: 'black',
              fontSize: 18,
              stepSize: 100,
              beginAtZero: true
            },
            gridLines: {
              color: 'rgba(100,100,100,0.5)',
              zeroLineColor: 'black'
            }
          }],
          xAxes: [{
            ticks: {
              fontColor: 'black',
              fontSize: 14,
              stepSize: 1,
              beginAtZero: false
            },
            gridLines: {
              color: 'rgba(100,100,100,0.5)',
              zeroLineColor: 'black'
            }
          }]
        }
      }
    });
  });
});

// Prepare a tweet div
function makeTweetDiv (tweet) {
  var newDiv = '<div class="tweet">' +
    '<p><a href="https://twitter.com/' + tweet.author + '/status/' + tweet.tweet_id + '">' + tweet.tweet_id + '</a></p>' +
      '<p>' + tweet.datetime + '</p>' +
        '<p><a href="https://twitter.com/' + tweet.author + '">' + tweet.author + '</a></p>' +
          '<p>' + tweet.content + '</p>' +
            '</div>';
  return newDiv;
}
