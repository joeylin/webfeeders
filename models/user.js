var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config').config;
var utility = require('utility');

var UserSchema = new Schema({
  name: { type: String},
  loginname: { type: String},
  pass: { type: String },
  email: { type: String},
  url: { type: String },
  company: { type: String },
  signature: { type: String },
  profile_image_url: {type: String},
  profile: { type: String },
  weibo: { type: String },
  avatar: { type: String },
  githubId: { type: String},
  githubUsername: {type: String},

  createAt: { type: Date, default: Date.now },
  is_admin: { type: Boolean, default: false },
  is_superadmin: { type: Boolean, default: false },
  is_block: {type: Boolean, default: false},
  role: { type: String, default: 0 },
  active: { type: Boolean, default: true },
  retrieve_time: {type: Number},
  retrieve_key: {type: String}
});

UserSchema.index({name: 1});
UserSchema.index({loginname: 1}, {unique: true});
UserSchema.index({email: 1}, {unique: true});
UserSchema.index({githubId: 1});

mongoose.model('User', UserSchema);
