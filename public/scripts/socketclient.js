/* global io:false */

'use strict';

var socket = io();
socket.connect();

// Got socket of tweets from database
socket.on('cachedTweets', function (data) {
  var tweetsDiv = document.getElementById('tweetList');
  var addedTweets = '';
  for (var t in data) {
    var tweet = data[t];
    addedTweets += '<p> CACHED RESULT:</p>';
    addedTweets += makeTweetDiv(tweet);
  }
  tweetsDiv.innerHTML = addedTweets + tweetsDiv.innerHTML;
});

// Got socket of tweets from get/search
socket.on('getRemoteTweets', function (data) {
  var tweetsDiv = document.getElementById('tweetList');
  var addedTweets = '';
  for (var t in data) {
    var tweet = data[t];
    addedTweets += '<p> GET/SEARCH RESULT:</p>';
    addedTweets += makeTweetDiv(tweet);
  }
  tweetsDiv.innerHTML = addedTweets + tweetsDiv.innerHTML;
});

// Got socket of streamed tweet
socket.on('streamedTweet', function (tweet) {
  var tweetsDiv = document.getElementById('tweetList');
  var addedTweets = '<p> STREAM RESULT:</p>';
  addedTweets += makeTweetDiv(tweet);
  tweetsDiv.innerHTML = addedTweets + tweetsDiv.innerHTML;
});

socket.on('getTweetFrequency', function (data) {
  console.log(data);
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
