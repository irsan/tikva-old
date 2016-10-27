const _ = require('lodash');
const Bunyan = require('bunyan');
const FS = require('fs');
const Model = require('../models/model');
const RandomString = require('randomstring');
const Response = require('../util/response');
const UUID = require('node-uuid');
const Vasync = require('vasync');

const log = Bunyan.createLogger({ name : 'tikva:controller.LoginController' });

function LoginController(socket) {
    this.socket = socket;
    this.otp = RandomString.generate({
        length: 6,
        charset: 'numeric'
    });
}

LoginController.prototype.start = function(callback) {
    var controller = this;
    controller.socket.emit("tikva:login", {});

    controller.socket.on("app:login:otp", (data) => {//When OTP is requested
        log.info("SENDING OTP ON REQUEST");
        controller.sendOTP();
    });

    controller.socket.on("app:login:login", (data) => {//When client is login using mobile and otp
        controller.login(data, callback);
    });

    controller.socket.on("app:login:verify", (data) => {//When client is verifying accessToken
        controller.verify(data, callback);
    });
};

LoginController.prototype.sendOTP = function() {
    log.info("LOGIN OTP", this.otp);
    //TODO: send OTP
};

LoginController.prototype.login = function(data, callback) {
    var controller = this;

    Vasync.waterfall([
        (callback) => {//query for user based on mobile number
            if(!data.mobile) {
                return callback("Mobile is required");
            }

            if(!data.otp) {
                return callback("OTP is required");
            }

            if(data.otp != controller.otp) {
                return callback("Invalid Mobile/OTP");
            }

            Model.User.findOne({
                mobile : data.mobile,
                status : 'active'
            }, callback)
        },
        (user, callback) => {//login by generating new accessToken
            if(!user) {
                return callback("Invalid Mobile/OTP");
            }

            var accessToken = UUID.v1();
            var deviceParams = _.merge({
                accessToken     : accessToken,
                user            : user
            }, data.device);

            Model.Device.findOne({
                uuid : data.device.uuid
            }, (error, device) => {
                if(error) {
                    return callback(error);
                }

                if(!device) {//create new device if it doesn't exist
                    device = new Model.Device(deviceParams);
                    device.save((error) => {
                        if(error) {
                            return callback(error);
                        }

                        return callback(null, {
                            accessToken : accessToken,
                            user : user
                        });
                    })
                } else {//update device's accessToken if it exists
                    Model.Device.update({
                        uuid : data.device.uuid
                    }, {
                        $set : deviceParams
                    }, (error) => {
                        if(error) {
                            return callback(error);
                        }

                        controller.socket.sessionId = accessToken + "-" + new Date().getTime();
                        controller.socket.me = user;

                        callback(null, {
                            accessToken : accessToken,
                            user : user
                        });
                    });
                }
            });
        }
    ], (error, result) => {
        controller.emit("loginResponse", error, result, data.requestId);
        callback(error, result);
    });
};

LoginController.prototype.verify = function(data, callback) {
    var controller = this;

    var query = {
        accessToken : data.accessToken,
        uuid : data.device.uuid,
        status : 'active'
    };

    Vasync.waterfall([
        (callback) => {
            Model.Device.findOne({
                accessToken : data.accessToken,
                uuid : data.device.uuid,
                status : 'active'
            }).select('user').populate('user').exec(callback);
        },
        (device, callback) => {
            if(!device) {
                return callback("Invalid access token");
            }

            controller.socket.sessionId = data.accessToken + "-" + new Date().getTime();
            controller.socket.me = device.user;

            callback(null, {
                user : device.user
            });
        }
    ], (error, result) => {
        controller.emit("verifyResponse", error, result, data.requestId);
        callback(error, result);
    })
};

LoginController.prototype.emit = function(responseType, error, data, requestId) {
    var response = new Response(requestId);
    if(error) {
        response.fail(error);
    } else {
        response.data = data;
    }

    this.socket.emit("tikva:login:" + responseType, response);
};

module.exports = LoginController;