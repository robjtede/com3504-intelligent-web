/* global io:false Chart:false */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var tweetsDiv = document.querySelector('.tweet-list');
  var playerProfileDiv = document.querySelector('.player-profiles');
  var getRemoteButton = document.querySelector('.remote-tweets-button');
  var chart = document.querySelector('.stats .chart canvas');
  var statsTable = document.querySelector('.stats .table');

  var playerEl = document.querySelector('.tracking-info .tracking-player');
  var teamEl = document.querySelector('.tracking-info .tracking-team');
  var authorEl = document.querySelector('.tracking-info .tracking-author');
  var modeEl = document.querySelector('.tracking-info .tracking-mode');

  var tweetsPerPageSlider = document.querySelector('.js-page-size');
  var tweetsPerPageIndicator = document.querySelector('.js-page-size-indicator');
  var prevPage = document.querySelector('.js-prev-page');
  var nextPage = document.querySelector('.js-next-page');

  var socket = io.connect();
  var pathname = window.location.pathname;

  var series = [];
  var tweetList = [];
  var frequencyChart = null;
  var tweetsPerPage = 100;
  var page = 0;

  if (getRemoteButton) {
    getRemoteButton.addEventListener('click', requestRemoteTweets);
  }

  socket.on('connect', function () {
    // console.log('connected', socket.id);

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

  socket.on('trackingInfo', function (q) {
    console.log('get tracking info');

    if (!q.terms_player && playerEl) playerEl.style.display = 'none';
    if (!q.terms_team && teamEl) teamEl.style.display = 'none';
    if (!q.terms_author && authorEl) authorEl.style.display = 'none';
    if (!q.search_mode && modeEl) modeEl.style.display = 'none';

    if (playerEl) playerEl.textContent = q.terms_player;
    if (teamEl) teamEl.textContent = q.terms_team;
    if (authorEl) authorEl.textContent = q.terms_author;
    if (modeEl) modeEl.textContent = q.search_mode;
  });

  // Add player profile info
  socket.on('playerProfile', function (profileData) {
    var profileStr =
      '<div class="player-info">' +
        '<img src="' + profileData.imgUrl + '" width="80px">' +
        '<p class="player-info-name">' + profileData.name + '</p>' +
        '<p class="player-info-club">' + profileData.club + '</p>' +
        '<p class="player-info-pos">' + profileData.position + '</p>' +
        '<p class="player-info-dob">' + profileData.dob + '</p>' +
      '</div>';

    if (playerProfileDiv) {
      playerProfileDiv.innerHTML += profileStr;
      playerProfileDiv.style.display = 'block';
    }
  });

  // Recieved tweets from database
  socket.on('cachedTweets', function (data) {
    console.log('got cached tweets');

    // add each to beginning of tweet array
    data.forEach(function (tweet) {
      tweet.dataSource = 'cache';
      tweetList.unshift(tweet);
    });

    if (data.length) {
      renderTweetList();
    } else {
      requestRemoteTweets();
    }
  });

  // Recieved tweets from get/search
  socket.on('getRemoteTweets', function (data) {
    console.log('got remote tweets');

    // add each to beginning of tweet array
    data.reverse().forEach(function (tweet) {
      tweet.dataSource = 'remote';
      tweetList.unshift(tweet);
    });

    renderTweetList();
  });

  // Recieved streamed tweet
  socket.on('streamedTweet', function (tweet) {
    console.log('got streamed tweet');

    tweet.dataSource = 'stream';

    // add to beginning of tweet array
    tweetList.unshift(tweet);

    renderTweetList();

    series[6].num += 1;
    updateStats();
  });

  // Recieved tweet frequencies
  socket.on('getTweetFrequency', function (data) {
    // console.log('got tweet frequency', data);

    // map time strings to Date objects
    data = data.map(function (s) {
      s.day = new Date(s.day);
      return s;
    });

    // if chart does not exist create it
    if (!frequencyChart) {
      // store initial data
      series = data;

      // create and draw line chart
      frequencyChart = Chart.Line(chart.getContext('2d'), {
        data: {
          labels: series.map(function (t) { return t.day.getDate(); }),
          datasets: [{
            label: 'Frequency',
            data: series.map(function (t) { return t.num; }),
            fill: false,
            lineTension: 0.3,
            pointRadius: 5,
            pointHitRadius: 40,
            borderColor: 'red',
            pointBorderColor: 'red',
            pointBackgroundColor: 'red'
          }]
        },
        options: {
          responsive: true,
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true,
                suggestedMax: 5
              }
            }]
          }
        }
      });
    } else {
      // update stats data
      data.forEach(function (day, index) {
        series[index].num += day.num;
      });
    }

    updateStats();
  });

  function updateStats () {
    frequencyChart.data.datasets[0].data = series.map(function (t) { return t.num; });
    frequencyChart.update();

    while (statsTable.firstChild) statsTable.removeChild(statsTable.firstChild);
    statsTable.appendChild(createTable(series));
  }

  function renderTweetList () {
    while (tweetsDiv.firstChild) {
      tweetsDiv.removeChild(tweetsDiv.firstChild);
    }

    var start = page * tweetsPerPage;
    var end = start + tweetsPerPage;

    tweetList.slice(start, end).forEach(function (tweet) {
      tweetsDiv.appendChild(makeTweetDiv(tweet));
    });
  }

  function requestRemoteTweets () {
    if (pathname.substring(0, 16) === '/trackings/show/') {
      var trackIdStr = pathname.substring(16);
      var trackId = parseInt(trackIdStr);
      socket.emit('requestRemoteTweets', {
        path: pathname,
        trackingId: trackId
      });
      getRemoteButton.style.display = 'none';
    }
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
  if (tweetsPerPageSlider) {
    tweetsPerPageSlider.addEventListener('change', updateTweetsPerPage);
  }

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

    page = toPage;
    renderTweetList();
  }

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

  function createTable (series) {
    var table = document.createElement('table');

    var trTitle = document.createElement('tr');
    var tdDayTitle = document.createElement('td');
    tdDayTitle.textContent = 'Day';

    var tdNumTitle = document.createElement('td');
    tdNumTitle.textContent = 'No. of Tweets';

    trTitle.appendChild(tdDayTitle);
    trTitle.appendChild(tdNumTitle);
    table.appendChild(trTitle);

    series.forEach(function (day) {
      var tr = document.createElement('tr');
      var tdDay = document.createElement('td');
      var tdNum = document.createElement('td');

      tdDay.textContent = day.day.getDate() + '/' + day.day.getMonth() + '/' + day.day.getFullYear();
      tdNum.textContent = day.num;

      tr.appendChild(tdDay);
      tr.appendChild(tdNum);
      table.appendChild(tr);
    });

    var tr = document.createElement('tr');
    var tdTotalTitle = document.createElement('td');
    tdTotalTitle.textContent = 'Total';

    var tdTotal = document.createElement('td');
    tdTotal.textContent = series.reduce(function (acc, d) { return acc + d.num; }, 0);

    tr.appendChild(tdTotalTitle);
    tr.appendChild(tdTotal);
    table.appendChild(tr);

    return table;
  }
});
