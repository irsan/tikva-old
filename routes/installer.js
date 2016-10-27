const _ = require('lodash');
const Bunyan = require('bunyan');
const FS = require('fs');
const Model = require('../models/model');
const RandomString = require('randomstring');
const Response = require('../util/response');
const UUID = require('node-uuid');
const Vasync = require('vasync');

const log = Bunyan.createLogger({ name : 'tikva:controller.Installer' });

const INSTALLED_FILE = './resources/installed.json';
const INSTALLED_EXAMPLE_FILE = './resources/installed.example.json';

function Installer() {
}

Installer.prototype.init = function(ioSocket, callback) {
    var installer = this;

    Vasync.waterfall([
        (callback) => {//check if installed.json exists if not copy from installed.example.json
            if(FS.existsSync(INSTALLED_FILE)) {
                return callback();
            }

            var writeStream = FS.createWriteStream(INSTALLED_FILE);

            writeStream.on('close', function() {
                callback();
            });

            FS.createReadStream(INSTALLED_EXAMPLE_FILE).pipe(writeStream);
        }
    ], () => {
        installer.installed = JSON.parse(FS.readFileSync('./resources/installed.json', 'utf8')).installed;
        installer.socket = ioSocket;
        if(!installer.installed) {
            installer.key = RandomString.generate(7);
            log.info("INSTALLATION MODE", installer.key);
        }
        callback(null, installer.installed);
    });
};

Installer.prototype.start = function() {
    var installer = this;
    installer.socket.emit("tikva:install", {});
    installer.socket.on("app:install:request", function(data) {
        installer.install(data);
    });
};

Installer.prototype.install = function(data) {
    var installer = this;

    Vasync.waterfall([
        (callback) => {//save user
            if(data.key != installer.key) {
                return callback("Invalid key");
            }

            var user = new Model.User({
                name : data.name,
                mobile : data.mobile,
                administrator : true
            });

            user.save((error, user) => {
                if(error) {
                    return callback(error);
                }

                callback(null, user);
            });
        },
        (user, callback) => {//update installed status
            FS.truncate("./resources/installed.json", 0, () => {

                FS.writeFile("./resources/installed.json", JSON.stringify({ installed : true }), (error) => {
                    if(error) {
                        log.error("Error writing file: " + error);
                        return callback(error);
                    }

                    installer.installed = true;
                    callback(null, user);
                });
            });
        },
        (user, callback) => {//generate accessToken
            var accessToken = UUID.v1();
            var deviceParams = _.merge({
                accessToken     : accessToken,
                user            : user
            }, data.device);
            var device = new Model.Device(deviceParams);
            device.save((error, device) => {
                if(error) {
                    return callback(error);
                }
                callback(null, {
                    accessToken : device.accessToken,
                    user : user
                });
            });
        }
    ], (error, result) => {
        installer.callback(error, result, data.requestId);
    });
};

Installer.prototype.callback = function(error, data, requestId) {
    var response = new Response(requestId);
    if(error) {
        response.fail(error);
    } else {
        response.data = data;
    }

    this.socket.emit("tikva:install:response", response);
};

module.exports = Installer;