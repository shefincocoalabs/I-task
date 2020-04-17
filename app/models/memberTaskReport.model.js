const mongoose = require('mongoose');

function transform(ret) {
  ret.id = ret._id;
  delete ret._id;
  delete ret.status;
  delete ret.tsCreatedAt;
  delete ret.tsModifiedAt;
}
var options = {
  toObject: {
    virtuals: true,
    transform: function (doc, ret) {
      transform(ret);
    }
  },
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      transform(ret);
    }
  }
};

const MemberTaskReportSchema = mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  },
  completedDate: String,
  notes: String,
  status: Number,
  tsCreatedAt: Number,
  tsModifiedAt: Number

}, options);
module.exports = mongoose.model('MemberTaskReport', MemberTaskReportSchema, 'MemberTaskReports');
