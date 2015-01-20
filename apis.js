/**
 * Module dependencies.
 */

var sign = require('./controllers/sign');
var site = require('./controllers/site');
var user = require('./controllers/user');
var topic = require('./controllers/topic');
var rss = require('./controllers/rss');
var assets = require('./controllers/static');
var tools = require('./controllers/tools');
var auth = require('./middlewares/auth');
var admin = require('./controllers/admin');
var config = require('./config');

var getUploadToken = function(req, res) {
    var qiniu = require('qiniu');
    qiniu.conf.ACCESS_KEY = config.qiniu.accessKey;
    qiniu.conf.SECRET_KEY = config.qiniu.secretKey;
    var putPolicy = new qiniu.rs.PutPolicy(config.qiniu.bucket);
    var result = {
        token: putPolicy.token(),
        host: config.qiniu.bucketHost
    };
    res.json(result.token);
};

module.exports = function (app) {
	
	// token
	app.get('/api/token.json', auth.userRequired, getUploadToken);

	app.get('/api/admin/topics', auth.userRequired, admin.topics);
	app.get('/api/admin/unchecked', auth.userRequired, admin.unchecked);
	app.get('/api/admin/users', auth.userRequired, admin.users);
	app.get('/api/admin/topics', auth.userRequired, admin.topics);

	app.post('/api/admin/check', auth.userRequired, admin.check);
	app.post('/api/admin/setAdmin', auth.userRequired, admin.setAdmin);
}