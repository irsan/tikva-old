const Bunyan = require('bunyan');
const FS = require('fs');
const Model = require('../models/model');
const RandomString = require('randomstring');
const Response = require('../util/response');
const Vasync = require('vasync');

const log = Bunyan.createLogger({ name : 'tikva:controller.installer' });

function Installer() {
}

Installer.prototype.init = function(ioSocket) {
    var installer = this;
    
    installer.installed = JSON.parse(FS.readFileSync('./resources/installed.json', 'utf8')).installed;
    if(!installer.installed) {
        installer.socket = ioSocket;

        installer.key = RandomString.generate(7);

        log.info("INSTALLATION MODE", installer.key);

        installer.socket.emit("install", {});

        installer.socket.on("install", function(data) {
            installer.install(data);
        });
    }

    return installer.installed;
};

Installer.prototype.install = function(data) {
    var installer = this;
    
    log.info("INSTALL DATA", data, installer.key);
    if(data.key != installer.key) {
        return installer.fail("Invalid key");
    }

    var user = new Model.User({
        name : data.name,
        mobile : data.mobile,
        administrator : true
    });

    user.save(function(error, user) {
        if(error) {
            return installer.fail(error);
        }

        //update installed.json
        fs.truncate("../resources/installed.json", 0, function() {
            fs.writeFile("../resources/installed.json", JSON.stringify({ installed : true }), function(error) {
                if(error) {
                    log.error("Error writing file: " + error);
                    return installer.fail(error);
                }

                installer.installed = true;
            });
        });

        log.info("SAVED USER", user);
    });
};

Installer.prototype.fail = function(message) {
    var response = new Response();
    response.fail(message);
    this.socket.emit("response_install", response);
}

module.exports = Installer;