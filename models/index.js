var mongoose = require('mongoose');
var config = require('../config').config;

mongoose.connect(config.db, function (err) {
  if (err) {
    console.error('connect to %s error: ', config.db, err.message);
    process.exit(1);
  }
});

// models
require('./user');
require('./topic');
require('./collect');
require('./like');
require('./idGenerator');

exports.User = mongoose.model('User');
exports.Topic = mongoose.model('Topic');
exports.Like = mongoose.model('Like');
exports.Collect = mongoose.model('Collect');
exports.IdGenerator = mongoose.model('IdGenerator');
