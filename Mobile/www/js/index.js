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
var mydb;

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
		myDB = window.sqlitePlugin.openDatabase({name: "mySQLite.db", location: 'default'});
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
		var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:none;');
		
        console.log('Received Event: ' + id);
		
		myDB = window.sqlitePlugin.openDatabase({name: "mySQLite.db", location: 'default'});
		myDB.transaction(function (transaction) {
			//transaction.executeSql('DROP TABLE IF EXISTS `tweets`;DROP TABLE IF EXISTS `searches`;');
            transaction.executeSql('CREATE TABLE IF NOT EXISTS `searches` (' +
			'`id` INT  NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
			'`player` TEXT,' +
			'`team` TEXT,' +
			'`author` TEXT,' +
			'`newestTweet` BIGINT(20) DEFAULT \'0\',' +
			'`mode` VARCHAR(5) NOT NULL DEFAULT \'AND\'' +
			') DEFAULT CHARSET=utf8mb4;' +
			'CREATE TABLE IF NOT EXISTS `tweets` (' +
			'`local_id` BIGINT(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
			'`tweet_id` BIGINT(20) NOT NULL,' +
			'`author` VARCHAR(255) NOT NULL,' +
			'`datetime` DATETIME NOT NULL,' +
			'`content` TEXT NOT NULL,' +
			'`searches_id` INT NOT NULL,' +
			'FOREIGN KEY(`searches_id`) REFERENCES `searches`(`id`)' +
			') DEFAULT CHARSET=utf8mb4;');
        }, function (tx, result) {
                    alert("Table created successfully");
                },
                function (error) {
                    alert("Error occurred while creating the table.");
                });
        
		
		document.getElementById("submitSearchForm").addEventListener("click", submitSearchForm);
		document.getElementById("defaultOpen").addEventListener("click", getTrackingsList);
    }
};

app.initialize();


var socket = io.connect('http://10.0.2.2:3000');



document.addEventListener('deviceready', function () {
  document.getElementById("defaultOpen").click()
  socket.emit('getTableSearches');
  socket.emit('getTableTweets');
  
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
  
  socket.on('localCachedTweets', function (id) {
    console.log('got local cached tweets for: '+ id.id);
    var tweetsDiv = document.getElementById('tweetList');
    var tweetsCount = document.getElementById('tweetCount');
    var addedTweets = '';
	
	
	myDB.transaction(function (transaction) {
		transaction.executeSql('SELECT * FROM tweets WHERE search_id = ?', [id.id], function(data){
			
			console.log('data' + data);
			
			for (var t in data) {
				var tweet = data[t];

				addedTweets += '<p> LOCAL CACHED RESULT:</p>';
				addedTweets += makeTweetDiv(tweet);
			}

			tweetsDiv.innerHTML = addedTweets + tweetsDiv.innerHTML;
			tweetsCount.textContent = data.length;
			
		});
		}, function (tx, result) {
				
		},
		function (error) {
			console.log("Error occurred grabbing tweets");
		});
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
	tweetsCount.innerHTML = "Number of Tweets gathered: " + tweetsCount.textContent;
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
			'<div class="tracking-mode">' + results[i].mode + '</div>' +
			'</div>';
		}
		document.getElementById('Tracking').innerHTML = addTrackings;
    });
	
  socket.on('NewTrackingID', function (Id) {
	  console.log('got new traking id: ' + Id);
	  openResults(Id);
  });
  
  socket.on('playerProfile', function (profileData) {
		var profileStr = '<div><p>' + profileData.name + '</p>' +
                        '<p>' + profileData.club + '</p>' +
                        '<p>' + profileData.position + '</p>' +
                        '<img src="' + profileData.imgUrl + '"' +
                        ' width="80px"> </div>';
		var playerProfileDiv = document.getElementById('playerProfile');
		playerProfileDiv.innerHTML = profileStr + playerProfileDiv.innerHTML;
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
  
  socket.on('tableSearches', function(results){
		console.log('Sync searches');
		for(i in results){
			var sqlQuery = 'INSERT INTO searches (?,?,?,?,?)'
			myDB.transaction(function (transaction) {
			transaction.executeSql(sqlQuery,[results[i].terms_player, results[i].terms_team, results[i].terms_author, results[i].search_mode, results[i].newest_stored_tweet]);
			});
		}
  });
  
  socket.on('tableTweets', function (results){
	  console.log('Sync tweets');
	  for(i in results){
			var sqlQuery = 'INSERT INTO tweets (?,?,?,?,?)';
			myDB.transaction(function (transaction) {
			transaction.executeSql(sqlQuery,[results[i].tweet_id, results[i].author, results[i].datetime, results[i].content, results[i].searchesID]);
			}, function (tx, result) {
                    
                },
                function (error) {
                    console.log("Error occurred grabbing tweets");
                });
		
		}
  
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
      author: document.getElementById('mobileauthor').value,
	  isAnd: document.getElementById('querymode').value
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
	socket.emit('disconnectCordova');
	document.getElementById('playerProfile').innerHTML = "";
}

function openResults(id) {
	console.log('opening: '+ id);
	document.getElementById('tweetList').innerHTML = '';
	//socket.emit('getlocalCachedTweets', {id: id});
	socket.emit('join', {
        trackingId: id
    });
	socket.emit('requestRemoteTweets', {
        trackingId: id
    });
	openTab(event, 'Results');
	document.getElementById('ResultsTab').innerHTML = "Results";
	
}





