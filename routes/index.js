const Express = require('express');
const router = Express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.redirect("/install");
});

module.exports = router;