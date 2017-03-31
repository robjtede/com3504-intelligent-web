var socket = io();
socket.connect();
socket.on('gettweets', function(data) {
  var tweetsDiv = document.getElementById('tweetList');
  var addedTweets = '';
  for (var t in data.statuses) {
    var tweet = data.statuses[t];
    console.log(tweet);
    addedTweets += '<div class="tweet">' +
      '<p>' + tweet.created_at +'</p>' +
        '<p>' + tweet.user.screen_name +'</p>' +
          '<p>' + tweet.text +'</p>' +
            '</div>';
  }
  tweetsDiv.innerHTML = addedTweets + tweetsDiv.innerHTML;
});
