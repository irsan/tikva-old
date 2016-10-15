const Express = require('express');

const router = Express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('install', {title: 'Express'});
});

module.exports = router;