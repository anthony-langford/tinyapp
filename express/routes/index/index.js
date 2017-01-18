var express = require('express');
var router = express.Router();

router.get('/', function(request, response, next) {
  response.render('index', {
    users: [
      {id: 1, name: 'Tony'},
      {id: 2, name: 'Lucy'}
    ]
  });
});

  module.exports = router;