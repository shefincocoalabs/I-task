const mongoose = require('mongoose');

function transform(ret) {
  ret.id = ret._id;
  ret.projectMemberDetails = ret.memberId;
  delete ret.memberId;
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

const MemberTaskSchema = mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  },
  tasks: [{
    taskIds: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    }
  }],
  status: Number,
  tsCreatedAt: Number,
  tsModifiedAt: Number

}, options);
module.exports = mongoose.model('MemberTask', MemberTaskSchema, 'MemberTasks');
