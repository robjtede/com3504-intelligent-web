'use strict';
var sparql = require('sparql');
var sql = require('./sql');

var spCli = new sparql.Client('http://dbpedia.org/sparql');

module.exports = {
  findPlayer: findPlayer
};

function findPlayer (socket, q) {
  var termsStr = q.terms_player + ',' + q.terms_author;
  var terms = termsStr.split(',');
  console.log(terms);
  for (var i = 0; i < terms.length; i++) {
    if (terms[i].length > 0) {
      // TODO check exists in "existing players" database
      // Remove @ and trailing spaces
      var currTerm = terms[i].split('@').join('').trim().toLowerCase();
      sql.getPlayerRealName(currTerm).then(function (results) {
        console.log(results);
        if (results[0]) {
          var realName = results[0].real_name;
          if (realName) {
            console.log(realName);
            queryDbpedia(socket, realName);
          }
        }
      });
    }
  }
}

function queryDbpedia (socket, realName) {
  var spQuery = 'SELECT ?name ?position ?club ?thumbnail ' +
                'WHERE {?s a yago:FootballPlayer110101634 ; ' +
                'dbp:name ?name ; ' +
                'dbo:position/rdfs:label ?position ; ' +
                'dbo:thumbnail ?thumbnail ; ' +
                'dbp:currentclub/dbp:fullname ?club ' +
                '. FILTER (str(?name) = "' + realName + '")' +
                '} LIMIT 1';
  spCli.row(spQuery, function (err, res) {
    if (err) {
      console.error(err);
      throw err;
    }
    if (res) {
      console.log(res);
      var simplified = simplify(res);
      console.log(simplified);
      socket.emit('playerProfile', simplified);
    }
  });
}

function simplify (res) {
  return {
    name: res.name.value,
    position: res.position.value,
    club: res.club.value,
    imgUrl: res.thumbnail.value
  };
}
