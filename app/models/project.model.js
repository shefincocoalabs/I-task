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

const ProjectSchema = mongoose.Schema({
  projectCode: String,
  projectName: String,
  dueDate: String,
  description: String,
  projectCreatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isArchieved: Boolean,
  isCompleted : Boolean,
  completedDate: String,
  documents: Array,
  admin: {type: mongoose.Schema.Types.ObjectId, ref: 'Member'},
  status: Number,
  tsCreatedAt: Number,
  tsModifiedAt: Number

}, options);
module.exports = mongoose.model('Project', ProjectSchema, 'Projects');
