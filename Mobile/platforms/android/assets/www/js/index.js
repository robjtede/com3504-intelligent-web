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
		
		document.getElementById("submitSearchForm").addEventListener("click", submitSearchForm);
		document.getElementById("defaultOpen").addEventListener("click", getTrackingsList);
    }
};

app.initialize();

var socket = io.connect('http://10.0.2.2:3000');

document.addEventListener('deviceready', function () {
  document.getElementById("defaultOpen").click()
  

  socket.on('connect', function () {
    console.log('connected', socket.id);
    // Send query
    
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
  
  socket.on('serverTrackingsList', function (results) {
        if (results[0]) {
          // Has results
          console.log('has results')
        }
		var addTrackings = '';
		for (var i in results){
			addTrackings += '<div class="tracking" onclick="openResults(\'' + results[i].id + '\')">' +
			'<div class="tracking-player">' + results[i].player + '</div>' +
			'<div class="tracking-team">' + results[i].team + '</div>' +
			'<div class="tracking-author">' + results[i].author + '</div>' +
			'<div class="tracking-mode">or</div>' +
			'</div>';
		}
		document.getElementById('Tracking').innerHTML = addTrackings;
    });
	
  socket.on('NewTrackingID', function (tracking) {
	  console.log('got new traking id');
	  openResults(tracking.NewId);
  });
    
  socket.on('getTweetFrequency', function (data) {
    /*console.log('got tweet frequency');
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
    });*/
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

function getTrackingsList() {
	console.log('emitting get list request');
	socket.emit('getTrackingsList');
}

function submitSearchForm() {
	console.log('submit');
	socket.emit('newTracking', {
      player: document.getElementById('mobileplayer').value,
      team: document.getElementById('mobileteam').value,
      author: document.getElementById('mobileauthor').value
    });
}

function openTab(evt, TabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
	
    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(TabName).style.display = "block";
    evt.currentTarget.className += " active";
	
	document.getElementById('ResultsTab').innerHTML = "";
	socket.emit('disconnectCordova', {});
}

function openResults(id) {
	document.getElementById('tweetList').innerHTML = '';
	socket.emit('join', {
        trackingId: id
    });
	socket.emit('requestRemoteTweets', {
        trackingId: id
    });
	openTab(event, 'Results');
	document.getElementById('ResultsTab').innerHTML = "Results";
	
}





