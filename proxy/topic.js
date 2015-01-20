var EventProxy = require('eventproxy');

var models = require('../models');
var Topic = models.Topic;
var Collect = models.Collect;
var User = models.User;
var Like = models.Like;
var Util = require('../libs/util');
var convert = require('../libs/anyBaseConverter');
var IdGenerator = models.IdGenerator;


exports.getTopicById = function (id, callback) {
  var proxy = new EventProxy();
  var events = ['topic', 'author'];
  proxy.assign(events, function (topic, author, last_reply) {
    return callback(null, topic, author, last_reply);
  }).fail(callback);

  Topic.findOne({_id: id}, proxy.done(function (topic) {
    if (!topic) {
      proxy.emit('topic', null);
      proxy.emit('author', null);
      return;
    }
    proxy.emit('topic', topic);
    User.find({_id: topic.author_id}, proxy.done('author'));
  }));
};

exports.getTopic = function(id, callback) {
  Topic.findOne({_id: id}, callback);
}

exports.getCountByQuery = function (query, callback) {
  Topic.count(query, callback);
};

exports.getTopicsByQuery = function (query, opt, callback) {
  Topic.find(query, null, opt, function (err, docs) {
    if (err) {
      return callback(err);
    }
    if (docs.length === 0) {
      return callback(null, []);
    }

    var topics_id = [];
    for (var i = 0; i < docs.length; i++) {
      topics_id.push(docs[i]._id);
    }

    var proxy = new EventProxy();
    proxy.after('topic_ready', topics_id.length, function (topics) {
      // 过滤掉空值
      var filtered = topics.filter(function (item) {
        return !!item;
      });
      return callback(null, filtered);
    });
    proxy.fail(callback);

    topics_id.forEach(function (id, i) {
      exports.getTopicById(id, proxy.group('topic_ready', function (topic, author) {
        // 当id查询出来之后，进一步查询列表时，文章可能已经被删除了
        // 所以这里有可能是null
        if (topic) {
          topic.author = author;
          topic.friendly_create_at = Util.format_date(topic.create_at, true);
          if (topic.checkedDate) {
            topic.friendly_checkedDate = Util.format_date(topic.checkedDate, true);
          }
          
        }
        return topic;
      }));
    });
  });
};

exports.getTopics = function (query, opt, callback) {
  var keys = ['title', '_id', 'id', 'author_id', 'checkedBy', 'status', 'is_checked',
              'is_checkfail', 'reason', 'checkedDate', 'like_count', 'visit_count', 'collect_count'];
  Topic.find(query, null, opt)
    .populate('checkedBy')
    .populate('author_id')
    .exec(function(err, docs) {
      if (err) {
        return callback(err);
      }
      if (docs.length === 0) {
        return callback(null, []);
      }

      var proxy = new EventProxy();
      proxy.after('topic_ready', docs.length, function (topics) {
        // 过滤掉空值
        var filtered = topics.filter(function (item) {
          return !!item;
        });
        return callback(null, filtered);
      });
      proxy.fail(callback);

      docs.forEach(function (topic, i) {
        if (topic) {
          topic.friendly_create_at = Util.format_date(topic.create_at, true);
          if (topic.checkedDate) {
            topic.friendly_checkedDate = Util.format_date(topic.checkedDate, true);
          }
        }
        proxy.emit('topic_ready', topic);
      });
    })
};

exports.getFullTopic = function (id, callback) {
  var proxy = new EventProxy();
  var events = ['topic', 'author'];
  proxy
    .assign(events, function (topic, author) {
      callback(null, '', topic, author);
    })
    .fail(callback);

  Topic.findOne({id: id}, proxy.done(function (topic) {
    if (!topic) {
      proxy.unbind();
      return callback(null, '此资源不存在或已被删除。');
    }
    proxy.emit('topic', topic);
    
    User.find({_id: topic.author_id}, proxy.done(function (author) {
      if (!author) {
        proxy.unbind();
        return callback(null, '话题的作者丢了。');
      }
      proxy.emit('author', author);
    }));
  }));
};

exports.newAndSave = function (obj, callback) {
  var topic = new Topic();
  topic.title = obj.title;
  topic.content = obj.content;
  topic.git = obj.git;
  topic.demo = obj.demo;
  topic.doc = obj.doc;
  topic.license = obj.license;
  topic.dependency = obj.dependency;
  topic.tags = obj.tags;
  topic.author_id = obj.authorId;
  topic.status = obj.status;

  IdGenerator.getNewId('topic', function(err, doc) {
      topic.id = 'A' + convert(parseInt(doc.currentId), 50);
      topic.save(callback);
  });
};

exports.collect = function(user_id, topic_id, callback) {
  Collect.findOne({
    user_id: user_id,
    topic_id: topic_id
  }, function(err, collect) {
    if (err || collect) {
      return callback('已收藏', null);
    }
    Topic.findOne({
      _id: topic_id
    }, function(err, topic) {
      if (err || !topic) {
        collect.remove();
        return callback('资源已删除', null);
      }
      Collect.newAndSave(user_id, topic_id, function(err, collect) {
        topic.collect_count += 1;
        topic.save(cb);
      });
    });
  });     
};

exports.unCollect = function(user_id, topic_id, callback) {
  Collect.findOne({
    user_id: user_id,
    topic_id: topic_id
  }, function(err, collect) {
    if (err || !collect) {
      return callback('还没收藏', null);
    }
    Topic.findOne({
      _id: topic_id
    }, function(err, topic) {
      if (err || !topic) {
        return callback('资源已删除', null);
      }
      collect.remove();
      topic.collect_count -= 1;
      topic.save(cb);
    })
  });
};

exports.like = function(user_id, topic_id, callback) {
  Like.findOne({
    user_id: user_id,
    topic_id: topic_id
  }, function(err, like) {
    if (err || like) {
      return callback('已点赞', null);
    }
    Topic.findOne({
      _id: topic_id
    }, function(err, topic) {
      if (err || !topic) {
        like.remove();
        return callback('资源已删除', null);
      }
      Like.newAndSave(user_id, topic_id, function(err, like) {
        topic.collect_count += 1;
        topic.save(cb);
      });
    })
  }); 
};

exports.unlike = function(user_id, topic_id, callback) {
  Like.findOne({
    user_id: user_id,
    topic_id: topic_id
  }, function(err, like) {
    if (err || !like) {
      return callback('还没点赞', null);
    }
    Topic.findOne({
      _id: topic_id
    }, function(err, topic) {
      if (err || !topic) {
        like.remove();
        return callback('资源已删除', null);
      }
      like.remove();
      topic.collect_count -= 1;
      topic.save(cb);
    })
  });
};

// for sitemap
exports.getLimit5w = function (callback) {
  Topic.find({}, 'id create_at', {limit: 50000, sort: '-create_at'}, callback);
};

// init
// Topic.find({}, function(err, topics) {
//   for(var i=0; i<topics.length; i++) {
//     topics[i].is_checkfail = false;
//     topics[i].save(function() {
//       console.log('start');
//     });
//   }
// });

// User.findOne({_id: '546ab79ef4ce700820000001'}, function(err, user) {
//   user.is_superadmin = true;
//   user.save(function() {
//     console.log(user.name);
//   });
// });
