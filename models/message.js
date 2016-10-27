var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Message = new Schema({
    message         : String,
    type            : String,
    tikva           : { type : Boolean, default : false },
    action          : String,
    sessionId       : String,
    user            : { type : Schema.Types.ObjectId, ref : 'User' },
    createdAt       : { type : Date, default : Date.now },
    updatedAt       : { type : Date, default : Date.now },
    creator         : { type : String, default : 'System' },
    updater         : { type : String, default : 'System' },
    status          : { type : String, default : 'active' }
});

Message.index({ createdAt      : 1 });
Message.index({ updatedAt      : 1 });
Message.index({ creator        : 1 });
Message.index({ updater        : 1 });
Message.index({ status         : 1 });

Message.index({
    sessionId : 1,
    user : 1,
    status : 1
});

module.exports = mongoose.model('Message', Message);