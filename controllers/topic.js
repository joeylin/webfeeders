/**
 * Module dependencies.
 */

var sanitize = require('validator').sanitize;

var User = require('../proxy').User;
var Topic = require('../proxy').Topic;
var Collect = require('../proxy').Collect;
var Like = require('../proxy').Like;
var EventProxy = require('eventproxy');
var Util = require('../libs/util');

/**
 * Topic page
 *
 * @param  {HttpRequest} req
 * @param  {HttpResponse} res
 * @param  {Function} next
 */
exports.index = function (req, res, next) {
  var topic_id = req.params.tid;
  if (!topic_id) {
    return res.render('notify/notify', {
      error: '此话题不存在或已被删除。'
    });
  }
  var events = ['topic'];
  var ep = EventProxy.create(events, function (topic) {
    res.render('topic/index', {
      topic: topic,
    });
  });

  ep.fail(next);

  Topic.getFullTopic(topic_id, ep.done(function (message, topic, author) {
    if (message) {
      ep.unbind();
      return res.render('notify/notify', { error: message });
    }

    topic.visit_count += 1;
    topic.save();

    topic.friendly_create_at = Util.format_date(topic.create_at, true);
    topic.friendly_update_at = Util.format_date(topic.update_at, true);

    topic.author = author;
    ep.emit('topic', topic);
  }));
};

exports.create = function (req, res, next) {
  res.render('topic/edit');
};

exports.put = function (req, res, next) {
  var title = sanitize(req.body.title).trim();
  title = sanitize(title).xss();
  var demo = sanitize(req.body.demo).trim();
  demo = sanitize(demo).xss();
  var doc = sanitize(req.body.doc).trim();
  doc = sanitize(doc).xss();
  var git = sanitize(req.body.git).trim();
  git = sanitize(git).xss();
  var dependency = sanitize(req.body.dependency).trim();
  dependency = sanitize(dependency).xss();
  var license = sanitize(req.body.license).trim();
  license = sanitize(license).xss();

  var op = req.body.op;

  var content = req.body.t_content;
  var topic_tags = [];
  if (req.body.tags !== '') {
    topic_tags = req.body.tags.split(',');
  } else {
    return res.render('topic/edit', {
      tags: tags, 
      edit_error: '没填写标签', 
      title: title, 
      content: content, 
      git: git, 
      demo: demo, 
      doc: doc, 
      dependency: dependency
    });
  }

  var data = {
    title: title,
    tags: req.body.tags,
    content: content,
    authorId: req.session.user._id,
    dependency: dependency,
    demo: demo,
    doc: doc,
    git: git,
    license: license
  };

  if (op == 'draft') {
    data.status = 'draft';
  } else {
    data.status = 'publish';
  }

  var edit_error = title === '' ? '标题不能是空的。' : '';

  if (edit_error) {
    res.render('topic/edit', {
      tags: tags, 
      edit_error: edit_error, 
      title: title, 
      content: content, 
      git: git, 
      demo: demo, 
      doc: doc, 
      dependency: dependency, 
      license: license
    });
  } else {
    Topic.newAndSave(data, function (err, topic) {
      if (err) {
        return next(err);
      }

      var proxy = new EventProxy();
      var render = function () {
        res.redirect('/topic/' + topic.id);
      };

      proxy.assign('score_saved', render);
      proxy.fail(next);

      User.getUserById(req.session.user._id, proxy.done(function (user) {
        user.score += 5;
        user.topic_count += 1;
        user.save();
        req.session.user = user;
        proxy.emit('score_saved');
      }));

    });
  }
};

exports.showEdit = function (req, res, next) {
  if (!req.session.user) {
    res.redirect('/');
    return;
  }

  var topic_id = req.params.tid;
  if (topic_id.length !== 24) {
    res.render('notify/notify', {error: '此话题不存在或已被删除。'});
    return;
  }
  Topic.getTopic(topic_id, function (err, topic, tags) {
    if (!topic) {
      res.render('notify/notify', {error: '此话题不存在或已被删除。'});
      return;
    }

    // 权限控制
    if (topic.author_id.toString() !== req.session.user._id) {
      return res.render('notify/notify', {error: '对不起，你不能编辑此话题。'});
    } 

    res.render('topic/edit', {
      action: 'edit', 
      topic_id: topic._id, 
      title: topic.title, 
      content: topic.content, 
      tags: topic.tags, 
      demo: topic.demo,
      git: topic.git,
      license: topic.license,
      dependency: topic.dependency,
      doc: topic.doc
    });
  });
};

exports.update = function (req, res, next) {
  if (!req.session.user) {
    res.redirect('/');
    return;
  }
  var topic_id = req.params.tid;
  if (topic_id.length !== 24) {
    res.render('notify/notify', {error: '此话题不存在或已被删除。'});
    return;
  }

  Topic.getTopicById(topic_id, function (err, topic, tags) {
    if (!topic) {
      res.render('notify/notify', {error: '此话题不存在或已被删除。'});
      return;
    }

    // 权限控制
    if (topic.author_id.toString() !== req.session.user._id) {
       return res.render('notify/notify', {error: '对不起，你不能编辑此话题。'});
    }

    var title = sanitize(req.body.title).trim();
    title = sanitize(title).xss();
    var demo = sanitize(req.body.demo).trim();
    demo = sanitize(demo).xss();
    var git = sanitize(req.body.git).trim();
    git = sanitize(git).xss();
    var doc = sanitize(req.body.doc).trim();
    doc = sanitize(doc).xss();
    var dependency = sanitize(req.body.dependency).trim();
    dependency = sanitize(dependency).xss();
    var license = sanitize(req.body.license).trim();
    license = sanitize(license).xss();

    var content = req.body.t_content;
    var op = req.body.op;

    if (title === '' || content === '') {
      res.render('topic/edit', {
        action: 'edit', 
        edit_error: '标题或内容不能是空的。', 
        topic_id: topic._id, 
        content: content, 
        tags: req.body.tags, 
        demo: demo,
        git: git,
        doc: doc,
        license: license,
        dependency: dependency
      });
    } else {
      topic.title = title;
      topic.content = content;
      topic.demo = demo;
      topic.doc = doc;
      topic.git = git;
      topic.license = license;
      topic.dependency = dependency;
      topic.tags = req.body.tags;
      topic.update_at = new Date();

      if (op == 'draft') {
        topic.status = 'draft';
      } else {
        topic.status = 'publish';
      }

      topic.save(function (err) {
        if (err) {
          return next(err);
        }

        res.redirect('/topic/' + topic.id);
      });
    }

  });
};

exports.del = function (req, res, next) {
  
  // 权限控制 暂时没做
  var topic_id = req.params.tid;
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

exports.collect = function(req, res, next) {
  var user_id = req.session.user._id;
  var topic_id = req.params.tid;
  Topic.collect(user_id, topic_id, function(err, topic) {
    if (err) {
      return res.send({
        code: 404
      });
    }
    res.send({
      code: 200
    });
  });
};

exports.uncollect = function(req, res, next) {
  var user_id = req.session.user._id;
  var topic_id = req.params.tid;
  Topic.unCollect(user_id, topic_id, function(err, topic) {
    if (err) {
      return res.send({
        code: 404
      });
    }
    res.send({
      code: 200
    });
  });
};

exports.like = function(req, res, next) {
  var user_id = req.session.user._id;
  var topic_id = req.params.tid;
  Topic.like(user_id, topic_id, function(err, topic) {
    if (err) {
      return res.send({
        code: 404
      });
    }
    res.send({
      code: 200
    });
  });
};

exports.unlike = function(req, res, next) {
  var user_id = req.session.user._id;
  var topic_id = req.params.tid;
  Topic.unLike(user_id, topic_id, function(err, topic) {
    if (err) {
      return res.send({
        code: 404
      });
    }
    res.send({
      code: 200
    });
  });
};




