var models = require('../models');
var Collect = models.Collect;
var Topic = models.Topic;

exports.newAndSave = function(obj, cb) {
	var collect = new Collect();
	collect.user_id = obj.user_id;
	collect.topic_id = obj.topic_id;
	collect.save(cb);
};
exports.remove = function(user_id, topic_id, cb) {
	Collect.remove({
		user_id: user_id,
		topic_id: topic_id
	}, cb);
};
exports.getCollectsByUser = function(user_id, cb) {
	Collect.find({
		user_id: user_id
	}, cb);
};
