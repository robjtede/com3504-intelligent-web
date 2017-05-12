/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        this.receivedEvent('deviceready');
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
		var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:none;');

        console.log('Received Event: ' + id);
    }
};

app.initialize();

//document.addEventListener('deviceready', function () {
//	var socket = io.connect('http://10.0.2.2:3000');
//});

document.addEventListener('deviceready', function () {
  var socket = io.connect('http://10.0.2.2:3000');
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
    '<p>' + tweet.tweet_id + '</p>' +
      '<p>' + tweet.datetime + '</p>' +
        '<p>' + tweet.author + '</p>' +
          '<p>' + tweet.content + '</p>' +
            '</div>';
  return newDiv;
}
