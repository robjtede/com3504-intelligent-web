/* global io:false Chart:false */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var tweetsDiv = document.querySelector('#tweetList');
  var tweetsCount = document.querySelector('#tweetCount');
  var playerProfileDiv = document.querySelector('#playerProfiles');
  var getRemoteButton = document.querySelector('#remoteTweetsButton');
  var chart = document.getElementById('myChart');

  var socket = io.connect();
  var pathname = window.location.pathname;

  var tweetList = [];
  var frequencyChart = null;

  function renderTweetList (from) {
    if (!from) from = 0;

    while (tweetsDiv.firstChild) {
      tweetsDiv.removeChild(tweetsDiv.firstChild);
    }

    tweetList.slice(0, 60).forEach(function (tweet) {
      tweetsDiv.appendChild(makeTweetDiv(tweet));
    });
  }

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
      tweet.dataSource = 'cache';
      tweetList.unshift(tweet);
    });

    tweetsCount.textContent = data.length;
    renderTweetList(0);
  });

  // Got socket of tweets from get/search
  socket.on('getRemoteTweets', function (data) {
    console.log('got remote tweets');

    data.forEach(function (tweet) {
      tweet.dataSource = 'remote';
      tweetList.unshift(tweet);
    });

    tweetsCount.textContent = parseInt(tweetsCount.textContent) + data.length;

    renderTweetList(0);
  });

  // Got socket of streamed tweet
  socket.on('streamedTweet', function (tweet) {
    tweet.dataSource = 'stream';
    tweetList.unshift(tweet);

    tweetsCount.textContent = parseInt(tweetsCount.textContent) + 1;

    renderTweetList(0);
  });

  socket.on('getTweetFrequency', function (data) {
    console.log('got tweet frequency');
    var ctx = chart.getContext('2d');

    if (!frequencyChart) {
      // Creates and draws the line chart using the data
      frequencyChart = Chart.Line(ctx, {
        data: {
          labels: data.map(function (t) { return new Date(t.day).getDate() + 'th'; }),
          datasets: [{
            label: 'Frequency',
            data: data.map(function (t) { return t.num; }),
            fill: false
          }]
        },
        options: {
          responsive: false
        }
      });
    } else {
      frequencyChart;
    }
  });
});

function makeTweetDiv (tweet) {
  var $tweet = document.createElement('div');
  $tweet.classList.add('tweet');
  $tweet.classList.add('tweet-' + tweet.dataSource);

  var $tweetAuthor = document.createElement('p');
  var $tweetAvatar = document.createElement('div');
  var $tweetBody = document.createElement('p');
  var $tweetId = document.createElement('p');
  var $tweetName = document.createElement('p');
  var $tweetTime = document.createElement('p');

  $tweetAuthor.classList.add('tweet-author');
  $tweetAvatar.classList.add('tweet-avatar');
  $tweetBody.classList.add('tweet-body');
  $tweetId.classList.add('tweet-id');
  $tweetName.classList.add('tweet-name');
  $tweetTime.classList.add('tweet-time');

  var $tweetLink = document.createElement('a');
  var $tweetAuthorLink = document.createElement('a');
  var $tweetAvatarImg = document.createElement('img');

  $tweetBody.textContent = tweet.content;
  $tweetTime.textContent = tweet.datetime_human;
  $tweetName.textContent = tweet.name;

  $tweetLink.href = 'https://twitter.com/' + tweet.author + '/status/' + tweet.tweetId;
  $tweetLink.textContent = tweet.tweetId;

  $tweetAuthorLink.href = 'https://twitter.com/' + tweet.author;
  $tweetAuthorLink.textContent = tweet.author;

  $tweetAvatarImg.src = tweet.avatarUrl;

  $tweetId.appendChild($tweetLink);
  $tweetAuthor.appendChild($tweetAuthorLink);
  $tweetAvatar.appendChild($tweetAvatarImg);

  $tweet.appendChild($tweetAuthor);
  $tweet.appendChild($tweetAvatar);
  $tweet.appendChild($tweetBody);
  $tweet.appendChild($tweetId);
  $tweet.appendChild($tweetName);
  $tweet.appendChild($tweetTime);

  return $tweet;
}
