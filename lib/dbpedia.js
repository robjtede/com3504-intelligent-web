'use strict';
var sparql = require('sparql');

var spCli = new sparql.Client('http://dbpedia.org/sparql');

module.exports = {
  findPlayer: findPlayer
};

function findPlayer (q) {
  var termsStr = q.terms_player + ',' + q.terms_author;
  var terms = termsStr.split(',');
  console.log(terms);
  for (var i = 0; i < terms.length; i++) {
    if (terms[i]) {
      // TODO check exists in "existing players" database
    }
  }
  var playerName = 'Wayne Rooney';
  var spQuery = 'SELECT ?name ?position ?club ?thumbnail ' +
                'WHERE {?s a yago:FootballPlayer110101634 ; ' +
                'dbp:name ?name ; ' +
                'dbo:position ?position ; ' +
                'dbo:thumbnail ?thumbnail ; ' +
                'dbp:currentclub/dbp:fullname ?club ' +
                '. FILTER (str(?name) = "' + playerName + '")' +
                '} LIMIT 1';
  spCli.row(spQuery, function (err, res) {
    if (err) {
      console.error(err);
      throw err;
    }
    console.log(res);
  });
}
