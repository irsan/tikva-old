const _ = require('lodash');
const Bunyan = require('bunyan');
const Model = require('../models/model');
const Route = require('./route');
const UUID = require('node-uuid');
const Vasync = require('vasync');

const CarecellController = require('../controller/carecell_controller');

const log = Bunyan.createLogger({name: 'tikva:routes.CommandRoute'});

// inherit Route
CommandRoute.prototype = new Route();
CommandRoute.prototype.constructor = CommandRoute;
function CommandRoute(socket) {
    this.socket = socket;
    this.moduleName = "command";
}

CommandRoute.prototype.start = function () {
    var route = this;

    route.socket.on("app:command:start", (params) => {
        route.runStart(params);
    });
};

CommandRoute.prototype.runStart = function (params) {
    var route = this;

    var data = {
        cards : [],
        inputMessageLabel : "How can I help you?",
        suggestedActions : []
    };

    Vasync.waterfall([
        (callback) => {//check for admin
            if(route.socket.me.administrator) {
                Model.Carecell.count({
                    status : 'active'
                }, (error, count) => {
                    if(error) {
                        return callback(error);
                    }

                    if(count == 0) {
                        data.suggestedActions.push({
                            text : "Init carecells",
                            command : "app:admin:cell:init",
                            params : {}
                        });
                    }

                    return callback();
                });
            } else {
                callback();
            }
        },
        (callback) => {
            if(route.socket.me.carecell) {
                route.socket.me.populate('carecell', (error, me) => {
                    if(error) {
                        return callback(error);
                    }
                    log.info("POPULATE CARECELL", error, me);
                    var carecell = me.carecell.toJSON();
                    delete carecell._id;
                    data.cards.push({
                        type : 'carecell',
                        data : carecell,
                        createdAt : new Date()
                    });

                    if(route.socket.me.administrator) {
                        data.suggestedActions.push({
                            text : "Add SP",
                            command : "app:admin:sp:add"
                        });
                    }

                    data.suggestedActions.push({
                        text : "Add FTV",
                        command : "app:command:ftv:add"
                    });

                    data.suggestedActions.push({
                        text : "Add Decision",
                        command : "app:command:decision:add"
                    });

                    callback();
                });
            } else {
                callback();
            }
        }
    ], (error) => {
        log.info("SENDING START RESPONSE", error, data);
        route.emit("startResponse", error, data, params.requestId);
    });
};

CommandRoute.prototype.addSP = function (params) {
    var route = this;

    CarecellController.addSP(route.socket.me.carecell, params, null);
};

module.exports = CommandRoute;