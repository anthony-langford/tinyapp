var express = require('express');
var router = express.Router();

router.get('/', function(request, response, next) {
  response.json({
    users: [{
      id: 1,
      name: 'Tony'
    }]
  });
});

  module.exports = router;