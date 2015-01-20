var crypto = require('crypto');
var config = require('../config').config;
var User = require('../proxy').User;

// 在验证是否登录中间件之后使用
exports.reset = function (req, res, next) {
  User.findOne({
	_id: id
  }, function(err, user) {
  		req.session.user = user;
		gen_session(user, res);
		next();
  });
};

// private
function gen_session(user, res) {
  var auth_token = encrypt(user._id + '\t' + user.name + '\t' + user.pass + '\t' + user.email, config.session_secret);
  res.cookie(config.auth_cookie_name, auth_token, {path: '/', maxAge: 1000 * 60 * 60 * 24 * 30}); //cookie 有效期30天
}

exports.gen_session = gen_session;

function encrypt(str, secret) {
  var cipher = crypto.createCipher('aes192', secret);
  var enc = cipher.update(str, 'utf8', 'hex');
  enc += cipher.final('hex');
  return enc;
}