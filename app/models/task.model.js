const mongoose = require('mongoose');

function transform(ret) {
  ret.id = ret._id;
  ret.project = ret.projectId;
  ret.member = ret.memberId;
  delete ret._id;
  delete ret.projectId;
  delete ret.memberId;
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

const TaskSchema = mongoose.Schema({
  taskName: String,
  projectName: String,
  dueDate: String,
  description: String,
  taskCreatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  },
  isCompleted: Boolean,
  completedDate: String,
  documents: Array,
  status: Number,
  tsCreatedAt: Number,
  tsModifiedAt: Number

}, options);
module.exports = mongoose.model('Task', TaskSchema, 'Tasks');
