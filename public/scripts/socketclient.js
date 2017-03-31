/* global io:false */

'use strict';

var ids = new Set();

var socket = io();
socket.connect();

// Got socket of tweets from database
socket.on('cachedTweets', function (data) {
  var tweetsDiv = document.getElementById('tweetList');
  var tweetsCount = document.getElementById('tweetCount');
  var addedTweets = '';

  for (var t in data) {
    var tweet = data[t];
    ids.add(tweet.id);

    addedTweets += '<p> CACHED RESULT:</p>';
    addedTweets += makeTweetDiv(tweet);
  }

  tweetsDiv.innerHTML = addedTweets + tweetsDiv.innerHTML;
  tweetsCount.textContent = data.length;
});

// Got socket of tweets from get/search
socket.on('getRemoteTweets', function (data) {
  var tweetsDiv = document.getElementById('tweetList');
  var tweetsCount = document.getElementById('tweetCount');
  var addedTweets = '';

  for (var t in data) {
    var tweet = data[t];
    if (ids.has(tweet.id)) continue;

    addedTweets += '<p> GET/SEARCH RESULT:</p>';
    addedTweets += makeTweetDiv(tweet);

    tweetsDiv.innerHTML = addedTweets + tweetsDiv.innerHTML;
    tweetsCount.textContent = parseInt(tweetsCount.textContent) + data.length;
  }
});

// Got socket of streamed tweet
socket.on('streamedTweet', function (tweet) {
  var tweetsDiv = document.getElementById('tweetList');
  var addedTweets = '<p> STREAM RESULT:</p>';
  addedTweets += makeTweetDiv(tweet);
  tweetsDiv.innerHTML = addedTweets + tweetsDiv.innerHTML;
});

socket.on('getTweetFrequency', function (data) {
  //console.log(data);
  var ctx = document.getElementById("myChart").getContext("2d");

  var my = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Object.keys(data),
      datasets: [{
        label: 'Frequency',
        data: Object.values(data),
        backgroundColor: "blue"
      }]
    },
    options: {
      responsive: false,
      scales: {
        yAxes: [{
          ticks: {
            fontColor: "black",
            fontSize: 18,
            stepSize: 100,
            beginAtZero:true
          },
          gridLines:{
            color:"rgba(100,100,100,0.5)",
            zeroLineColor:"black"
          }
        }],
        xAxes: [{
          ticks: {
            fontColor: "black",
            fontSize: 14,
            stepSize: 1,
            beginAtZero:false
          },
          gridLines:{
            color:"rgba(100,100,100,0.5)",
            zeroLineColor:"black"
          }
        }]
      }
    }
  });
});

// Prepare a tweet div
function makeTweetDiv (tweet) {
  var newDiv = '<div class="tweet">' +
    '<p>' + tweet.datetime + '</p>' +
      '<p>' + tweet.author + '</p>' +
        '<p>' + tweet.content + '</p>' +
          '</div>';
  return newDiv;
}
