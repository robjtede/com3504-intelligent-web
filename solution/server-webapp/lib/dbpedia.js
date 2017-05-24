'use strict';

var moment = require('moment');
var sparql = require('sparql');
var sql = require('./sql');

var spCli = new sparql.Client('http://dbpedia.org/sparql');

module.exports = {
  findPlayer: findPlayer
};

function findPlayer (socket, q) {
  var existingPIds = [];

  var termsStr = q.terms_player + ',' + q.terms_author;
  var terms = termsStr.split(',');

  console.log('player terms', terms);

  for (var i = 0; i < terms.length; i++) {
    if (terms[i].length > 0) {
      // Remove @ and trailing spaces
      var currTerm = terms[i].split('@').join('').trim().toLowerCase();
      sql.getPlayerRealName(currTerm).then(function (results) {
        // console.log(results);

        if (results[0]) {
          var realName = results[0].real_name;
          if (realName) {
            // console.log(realName);
            existingPIds.push(queryDbpedia(socket, realName, existingPIds));
          }
        }
      });
    }
  }
}

function queryDbpedia (socket, realName, existing) {
  var spQuery = 'SELECT ?name ?position ?club ?thumbnail ?dob ?pid ' +
                'WHERE {?s a yago:FootballPlayer110101634 ; ' +
                'dbp:name ?name ; ' +
                'dbo:position/rdfs:label ?position ; ' +
                'dbo:thumbnail ?thumbnail ; ' +
                'dbp:currentclub/dbp:fullname ?club ; ' +
                'dbo:birthDate ?dob ; ' +
                'dbo:wikiPageID ?pid ' +
                '. FILTER (str(?name) = "' + realName + '")' +
                '} LIMIT 1';

  // console.log(spQuery);

  spCli.row(spQuery, function (err, res) {
    if (err) {
      // Error, don't send results
      console.error('DBPedia retrieval failed - ignoring query', err);
    }

    if (res) {
      var id = res.pid.value;

      if (existing.indexOf(id) === -1) {
        // Id doesn't exist already
        var simplified = simplify(res);

        socket.emit('playerProfile', simplified);
        return id;
      }
    }
  });
}

// transform into compact/usable data
function simplify (res) {
  return {
    name: res.name.value,
    position: res.position.value,
    club: res.club.value,
    imgUrl: res.thumbnail.value,
    dob: moment(res.dob.value).format('Do MMMM YYYY')
  };
}
