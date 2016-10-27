var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
    name            : String,
    mobile          : String,
    administrator   : { type : Boolean, default : false },
    profileImage    : { type: String, default : "https://s3-ap-southeast-1.amazonaws.com/jie-tikva/user.svg" },
    carecell        : { type : Schema.Types.ObjectId, ref : 'Carecell' },
    role            : { type : String, default : 'SP' },
    createdAt       : { type : Date, default : Date.now },
    updatedAt       : { type : Date, default : Date.now },
    creator         : { type : String, default : 'System' },
    updater         : { type : String, default : 'System' },
    status          : { type : String, default : 'active' }
});

User.index({ name           : 1 });
User.index({ mobile         : 1 });
User.index({ administrator  : 1 });
User.index({ carecell       : 1 });
User.index({ role           : 1 });
User.index({ createdAt      : 1 });
User.index({ updatedAt      : 1 });
User.index({ creator        : 1 });
User.index({ updater        : 1 });
User.index({ status         : 1 });

module.exports = mongoose.model('User', User);