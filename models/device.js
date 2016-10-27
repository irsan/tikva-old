var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Device = new Schema({
    accessToken     : String,
    available       : Boolean,
    platform        : String,
    version         : String,
    uuid            : String,
    cordova         : String,
    model           : String,
    manufacturer    : String,
    isVirtual       : Boolean,
    serial          : String,
    user            : { type : Schema.Types.ObjectId, ref : 'User' },
    createdAt       : { type : Date, default : Date.now },
    updatedAt       : { type : Date, default : Date.now },
    creator         : { type : String, default : 'System' },
    updater         : { type : String, default : 'System' },
    status          : { type : String, default : 'active' }
});

Device.index({ accessToken  : 1 })
Device.index({ uuid         : 1 });
Device.index({ createdAt    : 1 });
Device.index({ updatedAt    : 1 });
Device.index({ creator      : 1 });
Device.index({ updater      : 1 });
Device.index({ status       : 1 });

Device.index({
    uuid : 1,
    status : 1
});

Device.index({
    accessToken : 1,
    uuid : 1,
    status : 1
});

module.exports = mongoose.model('Device', Device);