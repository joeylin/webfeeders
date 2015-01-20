
var User = require('../proxy').User;
var Topic = require('../proxy').Topic;
var Tag = require('../proxy').Tag;
var TagModel = require('../models').Tag;
var Collect = require('../proxy').Collect;
var Like = require('../proxy').Like;
var config = require('../config').config;
var EventProxy = require('eventproxy');
var mcache = require('memory-cache');


exports.index = function(req, res, next) {
  res.render('admin');
};

exports.topics = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  page = page > 0 ? page : 1;
  var user = req.session.user;
  var limit = config.list_topic_count;

  var proxy = EventProxy.create('topics', 'pages',
    function (topics, pages) {   
      res.send({
        code: 200,
        content: topics,
        current_page: page,
        total: pages
      });
    });
  proxy.fail(next);

  // 取主题
  var query = {
    status: 'publish',
    is_checked: true,
    is_delete: false
  };
  var options = { skip: (page - 1) * limit, limit: limit, sort: [
    ['create_at', 'desc']
  ]};
  Topic.getTopics(query, options, function(err, topics) {
    var ep = new EventProxy();
    proxy.emit('topics', topics);   
  });

  // 取分页数据
  Topic.getCountByQuery(query, proxy.done(function (all_topics_count) {
    var pages = Math.ceil(all_topics_count / limit);
    proxy.emit('pages', pages);
  }));
};

exports.unchecked = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  page = page > 0 ? page : 1;
  var user = req.session.user;
  var limit = config.list_topic_count;

  var proxy = EventProxy.create('topics', 'pages',
    function (topics, pages) {   
      res.send({
        code: 200,
        content: topics,
        current_page: page,
        total: pages
      });
    });
  proxy.fail(next);

  // 取主题
  var query = {
    status: 'publish',
    is_checked: false,
    is_checkfail: false,
    is_delete: false
  };
  var options = { skip: (page - 1) * limit, limit: limit, sort: [
    ['create_at', 'desc']
  ]};
  Topic.getTopics(query, options, function(err, topics) {
    var ep = new EventProxy();
    proxy.emit('topics', topics);   
  });

  // 取分页数据
  Topic.getCountByQuery(query, proxy.done(function (all_topics_count) {
    var pages = Math.ceil(all_topics_count / limit);
    proxy.emit('pages', pages);
  }));
};

exports.users = function(req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  page = page > 0 ? page : 1;
  var limit = config.list_topic_count;

  var proxy = EventProxy.create('users', 'pages',
    function (users, pages) {
      res.send({
        code: 200,
        content: users,
        current_page: page,
        total: pages
      });
    });
  proxy.fail(next);

  // 取用户
  var query = {};
  var options = { skip: (page - 1) * limit, limit: limit, sort: [
    ['create_at', 'desc' ]
  ] };
  User.getUsersByQuery(query, options, function(err, users) {
    proxy.emit('users', users);   
  });


  // 取分页数据
  User.getCountByQuery(query, proxy.done(function (all_topics_count) {
    var pages = Math.ceil(all_topics_count / limit);
    proxy.emit('pages', pages);
  }));
};

exports.topic_delete = function(req, res, next) {
  var topic_id = req.body.topic_id;
  if (topic_id.length !== 24) {
    return res.send({ code: 404, error: '此话题不存在或已被删除。' });
  }
  Topic.getTopic(topic_id, function (err, topic) {
    if (err) {
      return res.send({ code: 404, message: err.message });
    }
    if (!topic) {
      return res.send({ code: 404, message: '此话题不存在或已被删除。' });
    }
    if ( topic.author_id.toString() !== req.session.user._id) {
      return res.send({code: 404, message: '无权限'});
    }

    topic.is_delete = true
    topic.save(function (err) {
      if (err) {
        return res.send({ code: 404, message: err.message });
      }
      res.send({ code: 200});
    });
  });
};

exports.check = function(req, res, next) {
  var topic_id = req.body.topic_id;
  var checked = req.body.checked;
  Topic.getTopic(topic_id, function(err, topic) {
    if (checked) {
      topic.is_checked = true;
      topic.is_checkfail = false;
    } else {
      topic.is_checked = false;
      topic.is_checkfail = true;
    }
    topic.checkedDate = Date.now;
      
    topic.save(function(err) {
      if (err) {
        return res.send({
          code: 404
        });
      }
      res.send({
        code: 200
      });
    })
  });
};

exports.setAdmin = function(req, res, next) {
  var user_id = req.body.user_id;
  var admin = req.body.admin;
  User.getUserById(user_id, function(err, user) {
    if (admin) {
      user.is_admin = true;
    } else {
      user.is_admin = false;
    }
    
    user.save(function(err, user) {
      res.send({
        code: 200
      });
    });
  });
};
