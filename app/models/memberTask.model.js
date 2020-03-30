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

const MemberTaskSchema = mongoose.Schema({
    taskName: String,
    dueDate: String,
    description: String,
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    status: Number,
    tsCreatedAt: Number,
    tsModifiedAt: Number

},options);
module.exports = mongoose.model('MemberTask', MemberTaskSchema, 'MemberTasks');