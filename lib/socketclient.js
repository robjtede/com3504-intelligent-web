var socket = io();
socket.connect();
socket.on('gettweets', function(data) {
  var tweetsDiv = document.getElementById('tweetList');
  var addedTweets = '';
  console.log(data);
  for (var t in data) {
    var tweet = data[t];
    addedTweets += '<div class="tweet">' +
      '<p> GET/SEARCH RESULT </p>' +
        '<p>' + tweet.datetime +'</p>' +
          '<p>' + tweet.author +'</p>' +
            '<p>' + tweet.content +'</p>' +
              '</div>';
  }
  tweetsDiv.innerHTML = addedTweets + tweetsDiv.innerHTML;
});
