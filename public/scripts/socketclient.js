/* global io:false Chart:false */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var tweetsDiv = document.querySelector('#tweetList');
  var tweetsCount = document.querySelector('#tweetCount');
  var playerProfileDiv = document.querySelector('#playerProfiles');
  var getRemoteButton = document.querySelector('#remoteTweetsButton');

  var socket = io.connect();
  var pathname = window.location.pathname;

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
  if (playerProfileDiv) {
    socket.on('playerProfile', function (profileData) {
      var profileStr =
        '<div class="playerInfo">' +
          '<img src="' + profileData.imgUrl + '" width="80px">' +
          '<p>' + profileData.name + '</p>' +
          '<p>' + profileData.club + '</p>' +
          '<p>' + profileData.position + '</p>' +
        '</div>';

      playerProfileDiv.innerHTML += profileStr;
    });
  }

  // Got socket of tweets from database
  socket.on('cachedTweets', function (data) {
    console.log('got cached tweets');

    data.forEach(function (tweet) {
      tweetsDiv.insertBefore(makeTweetDiv(tweet, 'cache'), tweetsDiv.firstChild);
    });

    tweetsCount.textContent = data.length;
  });

  // Got socket of tweets from get/search
  socket.on('getRemoteTweets', function (data) {
    console.log('got remote tweets');

    data.forEach(function (tweet) {
      tweetsDiv.insertBefore(makeTweetDiv(tweet, 'remote'), tweetsDiv.firstChild);
    });

    tweetsCount.textContent = parseInt(tweetsCount.textContent) + data.length;
  });

  // Got socket of streamed tweet
  socket.on('streamedTweet', function (tweet) {
    tweetsDiv.insertBefore(makeTweetDiv(tweet, 'stream'), tweetsDiv.firstChild);
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

function makeTweetDiv (tweet, type) {
  var $tweet = document.createElement('div');
  $tweet.classList.add('tweet');
  $tweet.classList.add('tweet-' + type);

  var $tweetId = document.createElement('p');
  var $tweetTime = document.createElement('p');
  var $tweetAuthor = document.createElement('p');
  var $tweetBody = document.createElement('p');

  var $tweetLink = document.createElement('a');
  var $tweetAuthorLink = document.createElement('a');

  $tweetTime.textContent = tweet.datetime;
  $tweetBody.textContent = tweet.content;

  $tweetLink.href = 'https://twitter.com/' + tweet.author + '/status/' + tweet.tweet_id;
  $tweetLink.textContent = tweet.tweet_id;

  $tweetAuthorLink.href = 'https://twitter.com/' + tweet.author;
  $tweetAuthorLink.textContent = tweet.author;

  $tweetId.appendChild($tweetLink);
  $tweetAuthor.appendChild($tweetAuthorLink);

  $tweet.appendChild($tweetId);
  $tweet.appendChild($tweetTime);
  $tweet.appendChild($tweetAuthor);
  $tweet.appendChild($tweetBody);

  return $tweet;
}
