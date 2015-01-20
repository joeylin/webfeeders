var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var Util = require('../libs/util');

var TopicSchema = new Schema({
  id: { type: String },
  title: { type: String },
  content: { type: String },
  git: { type: String },
  demo: { type: String },
  doc: { type: String },
  dependency: { type: String },
  license: { type: String },
  tags: { type: String },
  create_at: { type: Date, default: Date.now },
  is_delete: { type: Boolean, default: false },
  update_at: { type: Date, default: Date.now },
  status: { type: String, default: 'publish' }, // publish craft
  is_checked: { type: Boolean, default: false }, 
  is_checkfail: { type: Boolean, default: false },
  reason: { type: String },
  checkedBy: { type: ObjectId, ref: 'User' },
  checkedDate: { type: Date },

  author_id: { type: ObjectId, ref: 'User' },
  like_count: { type: Number, default: 0 },     // 统计赞次数的计数器
  visit_count: { type: Number, default: 0 },
  collect_count: { type: Number, default: 0 }
});

TopicSchema.index({create_at: -1});
TopicSchema.index({author_id: 1, create_at: -1});

// topic.friendly_create_at = Util.format_date(topic.create_at, true);
// TopicSchema.virtual('friendly_create_at').get(function () {
//   return Util.format_date(this.create_at, true);
// });
// TopicSchema.virtual('friendly_checkedDate').get(function () {
//   return Util.format_date(this.checkedDate, true);
// });

mongoose.model('Topic', TopicSchema);
