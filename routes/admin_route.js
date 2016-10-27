const _ = require('lodash');
const Bunyan = require('bunyan');
const Model = require('../models/model');
const Route = require('./route');
const UUID = require('node-uuid');
const Vasync = require('vasync');

const CarecellController = require('../controller/carecell_controller');

const log = Bunyan.createLogger({ name : 'tikva:routes/AdminRoute' });

//inherit Route
AdminRoute.prototype = new Route();
AdminRoute.prototype.constructor = AdminRoute;
function AdminRoute(socket) {
    this.socket = socket;
    this.moduleName = "admin";
}

AdminRoute.prototype.start = function() {
    var route = this;

    route.socket.on("app:admin:cell:init", (params) => {
        route.initCells(params);
    });

    route.socket.on("app:admin:sp:add", (params) => {
        route.addSP(params);
    });
};

AdminRoute.prototype.initCells = function(params) {
    log.info("INIT CELLS", params);
    var route = this;

    var carecellNames = [ 'BoG', 'Nehemiah', 'Lewi', 'Imanuel', 'Yusuf' ];

    var i = 0;

    Vasync.forEachParallel({
        func : (carecellName, callback) => {
            var carecell = new Model.Carecell({
                name : carecellName,
                key : 'cell-' + UUID.v1()
            });

            carecell.save((error, carecell) => {
                if(error) {
                    return callback(error);
                }

                if(i++ == 0) {
                    route.socket.me.carecell = carecell;
                    route.socket.me.updater = route.socket.me.name;
                    route.socket.me.updatedAt = new Date();
                    route.socket.me.save();
                }

                var carecellResult = carecell.toJSON();
                delete carecellResult._id;

                callback(null, carecell);
            })
        },
        inputs : carecellNames
    }, (error, result) => {
        route.emit('cell:initResponse', error, {
            carecells : result.successes
        });
    });
};

AdminRoute.prototype.addSP = function (params) {
    var route = this;

    Vasync.waterfall([
        (callback) => {
            CarecellController.addSP(route.socket.me.carecell, params, (error, sp) => {
                if(error) {
                    return callback(error);
                }

                callback(null, {
                    card : {
                        type : 'info',
                        title : 'Add SP to ' + route.socket.me.carecell.name,
                        content : {
                            icon : sp.profileImage,
                            text : sp.name + " is added successfully."
                        }
                    }
                });
            });
        }
    ], (error, card) => {
        log.info("EMIT: sp:addResponse", error, card);
        route.emit('sp:addResponse', error, card);
    });
};

module.exports = AdminRoute;