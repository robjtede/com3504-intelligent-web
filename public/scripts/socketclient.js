/* global io:false Chart:false */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var ids = new Set();

  var socket = io.connect();
  var checkbox = document.getElementById('cacheonly');
  checkbox.checked = window.localStorage.useCache;

  checkbox.addEventListener('change', function (ev) {
    window.localStorage.useCache = checkbox.checked;
  });

  socket.on('connect', function () {
    console.log('connected', socket.id);
    // Send query
    socket.emit('join', {
      player: document.querySelector('#player').value,
      team: document.querySelector('#team').value,
      author: document.querySelector('#author').value,
      cacheOnly: window.localStorage.useCache
    });
  });

  // Got socket of tweets from database
  socket.on('cachedTweets', function (data) {
    console.log('got cached tweets');
    var tweetsDiv = document.getElementById('tweetList');
    var tweetsCount = document.getElementById('tweetCount');
    var addedTweets = '';

    for (var t in data) {
      var tweet = data[t];
      if (ids.has(tweet.tweet_id)) continue;
      ids.add(tweet.tweet_id);

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
      if (ids.has(tweet.tweet_id)) continue;

      addedTweets += '<p> GET/SEARCH RESULT:</p>';
      addedTweets += makeTweetDiv(tweet);

      tweetsDiv.innerHTML = addedTweets + tweetsDiv.innerHTML;
      tweetsCount.textContent = parseInt(tweetsCount.textContent) + data.length;
    }
  });

  // Got socket of streamed tweet
  socket.on('streamedTweet', function (tweet) {
    if (ids.has(tweet.tweet_id)) return;
    console.log('got streamed tweet', ids.has(tweet.id));

    if (!ids.has(tweet.id)) {
      var tweetsDiv = document.getElementById('tweetList');
      var addedTweets = '<p> STREAM RESULT:</p>';

      addedTweets += makeTweetDiv(tweet);
      tweetsDiv.innerHTML = addedTweets + tweetsDiv.innerHTML;
    }
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
    '<p>' + tweet.tweet_id + '</p>' +
      '<p>' + tweet.datetime + '</p>' +
        '<p>' + tweet.author + '</p>' +
          '<p>' + tweet.content + '</p>' +
            '</div>';
  return newDiv;
}
