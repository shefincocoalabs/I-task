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

const MemberSchema = mongoose.Schema({
    fullName: String,
    email: String,
    image: String,
    phone: String,
    position: String,
    projectId: {type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
    tasks: [{type: mongoose.Schema.Types.ObjectId, ref: 'Task'}],
    status: Number,
    tsCreatedAt: Number,
    tsModifiedAt: Number

},options);
module.exports = mongoose.model('Member', MemberSchema, 'Members');