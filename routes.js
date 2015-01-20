/*!
 * nodeclub - route.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var sign = require('./controllers/sign');
var site = require('./controllers/site');
var user = require('./controllers/user');
var admin = require('./controllers/admin');
var topic = require('./controllers/topic');
var rss = require('./controllers/rss');
var assets = require('./controllers/static');
var tools = require('./controllers/tools');
var auth = require('./middlewares/auth');
var session = require('./middlewares/session');
var limit = require('./middlewares/limit');
var status = require('./controllers/status');
var github = require('./controllers/github');
var search = require('./controllers/search');
var passport = require('passport');
var configMiddleware = require('./middlewares/conf');
var config = require('./config');


module.exports = function (app) {
  // home page
  app.get('/', site.index);
  app.get('/home', site.index);

  app.get('/sitemap.xml', site.sitemap);

  // sign up, login, logout
  if (config.allow_sign_up) {
    app.get('/signup', sign.showSignup);  // 跳转到注册页面
    app.post('/signup', sign.signup);  // 提交注册信息
  } else {
    app.get('/signup', configMiddleware.github, passport.authenticate('github'));  // 进行github验证
  }
  app.get('/signout', sign.signout); 
  // app.post('/signout', sign.signout);  // 登出
  app.get('/signin', sign.showLogin);  // 进入登录页面
  app.post('/signin', sign.login);  // 登录校验
  app.get('/active_account', sign.active_account);  //帐号激活

  // password
  app.get('/search_pass', sign.showSearchPass);  // 找回密码页面
  app.post('/search_pass', sign.updateSearchPass);  // 更新密码
  app.get('/reset_pass', sign.reset_pass);  // 进入重置密码页面
  app.post('/reset_pass', sign.update_pass);  // 更新密码

  // user
  app.get('/user/:name', user.index); // 用户个人主页
  app.get('/setting/password', auth.signinRequired, sign.reset_pass); // 修改密码
  app.post('/setting/password', auth.signinRequired, sign.update_pass); // 修改密码
  app.get('/setting', auth.signinRequired, user.showSetting); // 用户个人设置页
  app.post('/setting', auth.signinRequired, user.setting); // 提交个人信息设置
  app.get('/profile/collect', auth.signinRequired, user.list_collect);
  app.get('/profile/draft', auth.signinRequired, user.list_draft);
  app.get('/profile/checked', auth.signinRequired, user.list_checked);
  app.get('/profile/unchecked', auth.signinRequired, user.list_unChecked);
  app.get('/profile/checkfail', auth.signinRequired, user.list_checkfail);

  // topic
  // 新建文章界面
  app.get('/topic/create', auth.signinRequired, topic.create);
  app.post('/topic/create', auth.signinRequired, limit.postInterval, topic.put);
  app.get('/topic/:tid', topic.index);  // 显示某个话题
  app.get('/topic/:tid/edit', auth.signinRequired, topic.showEdit);  // 编辑某话题
  app.post('/topic/:tid/edit', auth.signinRequired, topic.update);
  app.post('/topic/:tid/delete', topic.del); 

  app.post('/topic/:tid/collect', auth.signinRequired, topic.collect);
  app.post('/topic/:tid/uncollect', auth.signinRequired, topic.uncollect);
  app.post('/topic/:tid/like', auth.signinRequired, topic.like);
  app.post('/topic/:tid/unlike', auth.signinRequired, topic.unlike);


  // 管理界面
  app.get('/admin/', auth.signinRequired, admin.index);
  app.get('/admin/index', auth.signinRequired, admin.index);
  app.get('/admin/unchecked', auth.signinRequired, admin.index);
  app.get('/admin/topics', auth.signinRequired, admin.index);
  app.get('/admin/users', auth.signinRequired, admin.index);


  // tools
  // app.get('/site_tools', tools.run_site_tools);

  // static
  // app.get('/about', assets.about);
  // app.get('/faq', assets.faq);

  //rss
  app.get('/rss', rss.index);

  // site status
  app.get('/status', status.status);

  // github oauth
  app.get('/auth/github', configMiddleware.github, passport.authenticate('github'));
  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/signin' }),
    github.callback);
  app.get('/auth/github/new', github.new);
  app.post('/auth/github/create', github.create);

  app.get('/search', site.search);
  app.get('/tags/:tag', site.tag);

};
