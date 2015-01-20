var User = require('../proxy').User;
var UserModel = require('../models').User;
var Tag = require('../proxy').Tag;
var Topic = require('../proxy').Topic;
var TopicModel = require('../models').Topic;
var Like = require('../proxy').Like;
var Collect = require('../proxy').Collect;
var utility = require('utility');

var Util = require('../libs/util');
var config = require('../config').config;
var EventProxy = require('eventproxy');
var check = require('validator').check;
var sanitize = require('validator').sanitize;
var crypto = require('crypto');

exports.index = function (req, res, next) {
  var user_name = req.params.name;
  User.getUserByName(user_name, function (err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.render('notify/notify', {error: '这个用户不存在。'});
      return;
    }

    var render = function (recent_topics, recent_replies, relation) {
      user.friendly_create_at = Util.format_date(user.create_at, true);
      // 如果用户没有激活，那么管理员可以帮忙激活
      var token = '';
      if (!user.active && req.session.user && req.session.user.is_admin) {
        token = utility.md5(user.email + config.session_secret);
      }
      // 重新设置图片尺寸
      user.avatar = user.avatar.replace('normal2', '100'); 
      res.render('user/index', {
        user: user,
        recent_topics: recent_topics,
        recent_replies: recent_replies,
        relation: relation,
        token: token,
        profile: true
      });
    };

    var proxy = new EventProxy();
    proxy.assign('recent_topics', 'recent_replies', 'relation', render);
    proxy.fail(next);

    var query = {author_id: user._id, isPublic: true};
    var opt = {limit: 10, sort: [
      ['create_at', 'desc']
    ]};
    Topic.getTopicsByQuery(query, opt, proxy.done('recent_topics'));

    Reply.getRepliesByAuthorId(user._id, {limit: 20, sort: [
        ['create_at', 'desc']
      ]},
      proxy.done(function (replies) {
        var topic_ids = [];
        for (var i = 0; i < replies.length; i++) {
          if (topic_ids.indexOf(replies[i].topic_id.toString()) < 0) {
            topic_ids.push(replies[i].topic_id.toString());
          }
        }
        var query = {_id: {'$in': topic_ids}};
        var opt = {limit: 5, sort: [
          ['create_at', 'desc']
        ]};
        Topic.getTopicsByQuery(query, opt, proxy.done('recent_replies'));
      }));

    if (!req.session.user) {
      proxy.emit('relation', null);
    } else {
      Relation.getRelation(req.session.user._id, user._id, proxy.done('relation'));
    }
  });
};

exports.profile = function (req, res, next) {
  var user_name = req.session.user.name;
  User.getUserByName(user_name, function (err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.render('notify/notify', {error: '这个用户不存在。'});
      return;
    }

    var render = function (recent_topics, recent_replies, relation) {
      user.friendly_create_at = Util.format_date(user.create_at, true);
      // 如果用户没有激活，那么管理员可以帮忙激活
      var token = '';
      if (!user.active && req.session.user && req.session.user.is_admin) {
        token = utility.md5(user.email + config.session_secret);
      }
      // 重新设置图片尺寸
      user.avatar = user.avatar.replace('normal2', '100');
      res.render('user/index', {
        user: user,
        recent_topics: recent_topics,
        recent_replies: recent_replies,
        relation: relation,
        token: token,
        profile: true
      });
    };

    var proxy = new EventProxy();
    proxy.assign('recent_topics', render);
    proxy.fail(next);

    var query = {
      author_id: user._id, 
      isPublic: true
    };
    var opt = {limit: 5, sort: [
      ['create_at', 'desc']
    ]};
    Topic.getTopicsByQuery(query, opt, proxy.done('recent_topics'));
  });
};

exports.showSetting = function (req, res, next) {
  if (!req.session.user) {
    res.redirect('/');
    return;
  }

  User.getUserById(req.session.user._id, function (err, user) {
    if (err) {
      return next(err);
    }
    if (req.query.save === 'success') {
      user.success = '保存成功。';
    }
    user.error = null;
    return res.render('user/setting', user);
  });
};

exports.setting = function (req, res, next) {
  if (!req.session.user) {
    res.redirect('/');
    return;
  }

  // 显示出错或成功信息
  function showMessage(msg, data, isSuccess) {
    var data = data || req.body;
    var data2 = {
      name: data.name,
      weibo: data.weibo,
      githubUsername: data.github || data.githubUsername,
    };
    if (isSuccess) {
      data2.success = msg;
    } else {
      data2.error = msg;
    }
    res.render('user/setting', data2);
  }

  // post
  var action = req.body.action;
  if (action === 'change_setting') {
    var name = sanitize(req.body.name).trim();
    name = sanitize(name).xss();
    var weibo = sanitize(req.body.weibo).trim();
    weibo = sanitize(weibo).xss();
    var url = sanitize(req.body.url).trim();
    url = sanitize(url).xss();
    var company = sanitize(req.body.company).trim();
    company = sanitize(company).xss();
    var signature = sanitize(req.body.signature).trim();
    signature = sanitize(signature).xss();
    var github = sanitize(req.body.github).trim();
    github = sanitize(github).xss();
    if (github.indexOf('@') === 0) {
      github = github.slice(1);
    }

    User.getUserById(req.session.user._id, function (err, user) {
      if (err) {
        return next(err);
      }
      user.weibo = weibo;
      user.githubId = github;
      user.url = url;
      user.company = company;
      user.name = name;
      user.signature = signature;
      user.save(function (err) {
        if (err) {
          return next(err);
        }
        req.session.user = user.toObject({virtual: true});
        return res.redirect('/setting?save=success');
      });
    });
  }
  if (action === 'change_password') {
    var old_pass = sanitize(req.body.old_pass).trim();
    var new_pass = sanitize(req.body.new_pass).trim();
    if (!old_pass || !new_pass) {
      return res.send('旧密码或新密码不得为空');
    }

    User.getUserById(req.session.user._id, function (err, user) {
      if (err) {
        return next(err);
      }
      var md5sum = crypto.createHash('md5');
      md5sum.update(old_pass);
      old_pass = md5sum.digest('hex');

      if (old_pass !== user.pass) {
        return showMessage('当前密码不正确。', user);
      }

      md5sum = crypto.createHash('md5');
      md5sum.update(new_pass);
      new_pass = md5sum.digest('hex');

      user.pass = new_pass;
      user.save(function (err) {
        if (err) {
          return next(err);
        }
        return showMessage('密码已被修改。', user, true);

      });
    });
  }
};

exports.list_collect = function(req, res, next) {
  var user_id = req.session.user._id;
  var page = Number(req.query.page) || 1;
  var limit = config.list_topic_count;

  User.getUserById(user_id, function (err, user) {
    if (!user) {
      res.render('user/notify', { error: '这个用户不存在。'});
      return;
    }

    var render = function (topics, relation, pages) {
      res.render('user/topics', {
        user: user,
        topics: topics,
        title: '我的收藏',
        current_page: page,
        pages: pages,
        base: '/profile/collect'
      });        
    };

    var proxy = new EventProxy();
    proxy.assign('topics', 'pages', render);
    proxy.fail(next);

    Collect.getCollectsByUser(user_id, function(err, collects) {
      if (err) {
        return cb(err, null);
      }
      if (!collects) {
        return cb(null, []);
      }
      var array = [];
      var length = collects.length;
      for (var i=0; i<length; i++) {
        array.push(collects[i].topic_id);
      }

      var query = { 
        id: { '$in': array},
        is_delete: false 
      };

      var opt = {skip: (page - 1) * limit, limit: limit, sort: [
        ['create_at', 'desc']
      ]};
      Topic.getTopicsByQuery(query, opt, proxy.done('topics'));

      var pages = Math.ceil(length / limit);
      proxy.emit('pages', pages);
    });  
  });
};

exports.list_checked = function (req, res, next) {
  getTopicByType(req, res, next, 'checked');
};

exports.list_draft = function (req, res, next) {
  getTopicByType(req, res, next, 'draft');
};

exports.list_unChecked = function (req, res, next) {
  getTopicByType(req, res, next, 'unChecked');
};

exports.list_checkfail = function (req, res, next) {
  getTopicByType(req, res, next, 'checkfail');
};

function getTopicByType(req, res, next, type) {
  var user_id = req.session.user._id;
  var page = Number(req.query.page) || 1;
  var limit = config.list_topic_count;
  var title = {
    draft: '我的草稿',
    checked: '已审核',
    unChecked: '未审核',
    checkfail: '审核失败'
  };

  User.getUserById(user_id, function (err, user) {
    if (!user) {
      res.render('user/notify', { error: '这个用户不存在。'});
      return;
    }

    var render = function (topics, relation, pages) {
      // user.friendly_create_at = Util.format_date(user.create_at, true);
      res.render('user/topics', {
        user: user,
        topics: topics,
        title: title[type],
        topicType: type,
        current_page: page,
        pages: pages,
        base: '/profile/' + type
      });        
    };

    var proxy = new EventProxy();
    proxy.assign('topics', 'pages', render);
    proxy.fail(next);

    var query = { 
      author_id: user._id, 
      is_delete: false 
    };
    if (type == 'draft') {
      query.status = 'draft'
    }
    if (type == 'checked') {
      query.status = 'publish';
      query.is_checked = true;
    }
    if (type == 'unChecked') {
      query.status = 'publish';
      query.is_checked = false;
    }
    if (type == 'checkfail') {
      query.status = 'publish';
      query.is_checkfail = true;
    }

    var opt = {skip: (page - 1) * limit, limit: limit, sort: [
      ['create_at', 'desc']
    ]};
    Topic.getTopicsByQuery(query, opt, proxy.done('topics'));

    Topic.getCountByQuery(query, proxy.done(function (all_topics_count) {
      var pages = Math.ceil(all_topics_count / limit);
      proxy.emit('pages', pages);
    }));
  });
};
