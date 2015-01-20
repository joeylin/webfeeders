
/**
 * Module dependencies.
 */

var User = require('../proxy').User;
var Topic = require('../proxy').Topic;
var Tag = require('../proxy').Tag;
var Collect = require('../proxy').Collect;
var Like = require('../proxy').Like;
var config = require('../config').config;

var mcache = require('memory-cache');

var cache = require('../common/cache');
var EventProxy = require('eventproxy');
var xmlbuilder = require('xmlbuilder');

// 主页的缓存工作
// setInterval(function () {
//   var limit = config.list_topic_count;
//   // 只缓存第一页, page = 1
//   var options = { skip: (1 - 1) * limit, limit: limit, sort: [
//     ['top', 'desc' ],
//     [ 'last_reply_at', 'desc' ]
//   ] };
//   var optionsStr = JSON.stringify(options);
//   Topic.getTopicsByQuery({}, options, function (err, topics) {
//     mcache.put(optionsStr, topics);
//     return topics;
//   });
// }, 1000 * 5); // 五秒更新一次
// END 主页的缓存工作

exports.index = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  page = page > 0 ? page : 1;
  var user = req.session.user;
  var limit = config.list_topic_count;

  var proxy = EventProxy.create('topics', 'pages',
    function (topics, pages) {   
      res.render('index', {
        topics: topics,
        current_page: page,
        list_topic_count: limit,
        pages: pages,
        site_links: config.site_links,
        home: true
      });
    });
  proxy.fail(next);

  // 取主题
  var query = {
    // isPublic: true,
    // is_delete: false
  };
  var options = { skip: (page - 1) * limit, limit: limit, sort: [
    ['create_at', 'desc']
  ]};
  Topic.getTopicsByQuery(query, options, function(err, topics) {
    proxy.emit('topics', topics);     
  });

  // 取分页数据
  Topic.getCountByQuery(query, proxy.done(function (all_topics_count) {
    var pages = Math.ceil(all_topics_count / limit);
    proxy.emit('pages', pages);
  }));
};

exports.search = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  var keyword = req.query.keyword;
  page = page > 0 ? page : 1;
  var limit = config.list_topic_count;

  var proxy = EventProxy.create('results', 'pages',
    function (results, count) {
      res.render('search', {
        keyword: keyword,
        topics: results,
        current_page: page,
        list_topic_count: limit,
        pages: count.pages,
        total: count.total,
        site_links: config.site_links
      });
    });
  proxy.fail(next);

  // 取主题
  var query = {};
  if (keyword) {
    query['$or'] = [
      { tags: new RegExp(keyword) },
      { title: new RegExp(keyword) },
      { content: new RegExp(keyword) }
    ];//模糊查询参数
  }

  var options = { skip: (page - 1) * limit, limit: limit, sort: [
    ['create_at', 'desc' ]
  ] };
  Topic.getTopicsByQuery(query, options, function(err, topics) {
    proxy.emit('results', topics);     
  });

  // 取分页数据
  Topic.getCountByQuery(query, proxy.done(function (all_topics_count) {
    var count = {};
    var pages = Math.ceil(all_topics_count / limit);
    count.pages = pages;
    count.total = all_topics_count;
    proxy.emit('pages', count);
  }));
};

exports.tag = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  var tag = req.params.tag;
  page = page > 0 ? page : 1;
  var user = req.session.user;
  var limit = config.list_topic_count;

  if (!tag) {
    return res.redirect('/');
  }

  var proxy = EventProxy.create('topics', 'pages',
    function (topics, pages) {
      res.render('tag', {
        tag: tag,
        topics: topics,
        current_page: page,
        list_topic_count: limit,
        pages: pages,
        site_links: config.site_links
      });
    });
  proxy.fail(next);

  // 取主题
  var query = {};
  if(tag) {
    query['tags'] = new RegExp(tag);//模糊查询参数
  } 
  var options = { skip: (page - 1) * limit, limit: limit, sort: [
    ['create_at', 'desc' ]
  ] };
  Topic.getTopicsByQuery(query, options, function(err, topics) {
    proxy.emit('topics', topics);     
  });

  // 取分页数据
  Topic.getCountByQuery(query, proxy.done(function (all_topics_count) {
    var pages = Math.ceil(all_topics_count / limit);
    proxy.emit('pages', pages);
  }));
};

exports.study = function(req, res, next) {
  res.render('english', {
    type: 'english'
  });
};

exports.sitemap = function (req, res, next) {
  var urlset = xmlbuilder.create('urlset',
    {version: '1.0', encoding: 'UTF-8'});
  urlset.att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

  var ep = new EventProxy();
  ep.fail(next);

  ep.all('sitemap', function (sitemap) {
    res.type('xml');
    res.send(sitemap);
  });

  cache.get('sitemap', ep.done(function (sitemapData) {
    if (sitemapData) {
      ep.emit('sitemap', sitemapData);
    } else {
      Topic.getLimit5w(function (err, topics) {
        if (err) {
          return next(err);
        }
        topics.forEach(function (topic) {
          var url = urlset.ele('url');
          url.ele('loc', 'http://webfaners/topic/' + topic.id);
          url.ele('lastmod', topic.create_at.toUTCString());
        });

        var sitemapData = urlset.end();
        // 缓存一天
        cache.set('sitemap', sitemapData, 1000 * 3600 * 24);
        ep.emit('sitemap', sitemapData);
      });
    }
  }));
};
