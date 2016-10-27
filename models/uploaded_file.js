var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UploadedFile = new Schema({
    description     : String,
    originalname    : String,
    encoding        : String,
    mimetype        : String,
    size            : Number,
    bucket          : String,
    key             : String,
    acl             : String,
    contentType     : String,
    etag            : String,
    publicURL       : String,
    uploader        : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt       : { type : Date, default : Date.now },
    updatedAt       : { type : Date, default : Date.now },
    creator         : { type : String, default : 'System' },
    updater         : { type : String, default : 'System' },
    status          : { type : String, default : 'active' }
});

UploadedFile.index({ key       : 1 });
UploadedFile.index({ uploader  : 1 });
UploadedFile.index({ createdAt : 1 });
UploadedFile.index({ updatedAt : 1 });
UploadedFile.index({ creator   : 1 });
UploadedFile.index({ updater   : 1 });
UploadedFile.index({ status    : 1 });

UploadedFile.index({
    key       : 1,
    status    : 1
})

module.exports = mongoose.model('UploadedFile', UploadedFile);