const Bunyan = require('bunyan');
const Model = require('../models/model');
const S3Util = require('../util/s3_util');
const UUID = require('node-uuid');
const Vasync = require('vasync');

const log = Bunyan.createLogger({ name : 'tikva:controller.UploadController' });

function UploadController() {
}

module.exports = UploadController;
