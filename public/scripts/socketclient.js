/* global io:false Chart:false */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var tweetsDiv = document.querySelector('#tweetList');
  var tweetsCount = document.querySelector('#tweetCount');
  var playerProfileDiv = document.querySelector('#playerProfiles');
  var getRemoteButton = document.querySelector('#remoteTweetsButton');
  var chart = document.querySelector('#myChart');

  var tweetsPerPageSlider = document.querySelector('.js-page-size');
  var tweetsPerPageIndicator = document.querySelector('.js-page-size-indicator');
  var prevPage = document.querySelector('.js-prev-page');
  var nextPage = document.querySelector('.js-next-page');

  var socket = io.connect();
  var pathname = window.location.pathname;

  var tweetList = [];
  var frequencyChart = null;
  var tweetsPerPage = 100;
  var page = 0;

  function renderTweetList () {
    while (tweetsDiv.firstChild) {
      tweetsDiv.removeChild(tweetsDiv.firstChild);
    }

    var start = page * tweetsPerPage;
    var end = start + tweetsPerPage;

    tweetList.slice(start, end).forEach(function (tweet) {
      tweetsDiv.appendChild(makeTweetDiv(tweet));
    });

    console.log(
      'rendering page', page,
      'from', start,
      'to', end
    );
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
    renderTweetList();
  });

  // Got socket of tweets from get/search
  socket.on('getRemoteTweets', function (data) {
    console.log('got remote tweets');

    data.forEach(function (tweet) {
      tweet.dataSource = 'remote';
      tweetList.unshift(tweet);
    });

    tweetsCount.textContent = parseInt(tweetsCount.textContent) + data.length;

    renderTweetList();
  });

  // Got socket of streamed tweet
  socket.on('streamedTweet', function (tweet) {
    tweet.dataSource = 'stream';
    tweetList.unshift(tweet);

    tweetsCount.textContent = parseInt(tweetsCount.textContent) + 1;

    renderTweetList();
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

  if (tweetsPerPageSlider) {
    tweetsPerPageSlider.addEventListener('change', updateTweetsPerPage);
  }

  function updateTweetsPerPage () {
    var val = tweetsPerPageSlider.value;
    val = parseInt(val);

    if (tweetsPerPageIndicator) tweetsPerPageIndicator.textContent = val;

    page = 0;
    tweetsPerPage = val;

    renderTweetList();
  }

  updateTweetsPerPage();

  if (prevPage && nextPage) {
    prevPage.addEventListener('click', function (ev) {
      ev.preventDefault();
      goToPage(page - 1);
    });

    nextPage.addEventListener('click', function (ev) {
      ev.preventDefault();
      goToPage(page + 1);
    });
  }

  function goToPage (toPage) {
    var maxPages = Math.floor(tweetList.length / tweetsPerPage);

    toPage = Math.max(toPage, 0);
    toPage = Math.min(toPage, maxPages);

    console.log('going to page', toPage);

    page = toPage;
    renderTweetList();
  }
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
