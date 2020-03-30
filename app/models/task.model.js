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

const TaskSchema = mongoose.Schema({
    taskName: String,
    projectName: String,
    dueDate: String,
    description: String,
    taskCreatedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    status: Number,
    tsCreatedAt: Number,
    tsModifiedAt: Number

},options);
module.exports = mongoose.model('Task', TaskSchema, 'Tasks');