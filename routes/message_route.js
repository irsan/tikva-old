const _ = require('lodash');
const Bunyan = require('bunyan');
const Model = require('../models/model');
const Response = require('../util/response');
const UUID = require('node-uuid');
const Vasync = require('vasync');
const Route = require('./route');
const Wit = require('node-wit');

const log = Bunyan.createLogger({name: 'tikva:controller.MessageController'});

const firstEntityValue = (entities, entity) => {
    const val = entities && entities[entity] &&
        Array.isArray(entities[entity]) &&
        entities[entity].length > 0 &&
        entities[entity][0].value;

    if (!val) {
        return null;
    }
    return typeof val === 'object' ? val.value : val;
};

//inherit Route
MessageRoute.prototype = new Route();
MessageRoute.prototype.constructor = MessageRoute;
function MessageRoute(socket) {
    this.socket = socket;
    this.moduleName = "message";
}

MessageRoute.prototype.start = function () {
    var route = this;

    route.wit = new Wit.Wit({
        accessToken: PROPERTIES.wit.key,
        actions: route.getWitActions()
    });

    route.session = {
        id : route.socket.sessionId + "-" + new Date().getTime(),
        context: {}
    };

    route.socket.on("app:message:mo", (params) => {//when send a message
        route.receiveMO(params);
    });
};

MessageRoute.prototype.getWitActions = function() {
    var route = this;

    var actions = {
        send(request, response) {
            const {sessionId, context, entities} = request;
            const {text, quickreplies} = response;
            return new Promise(function (resolve, reject) {
                console.log('sending... context', context);
                console.log('sending... entities', entities);
                console.log('sending... response', response.text);
                // console.log('request...', request.entities);
                // console.log('response...', response);

                var intent = firstEntityValue(entities, 'intent');

                route.intent = intent ? intent : route.intent;

                return resolve();
            });
        },
        updateMyProfileImage({context, entites}) {
            return new Promise(function(resolve, reject) {
                log.info("UPDATE MY PROFILE IMAGE");
                context.done = true;
                resolve(context);
            });
        },
        listMySPs({context, entities}) {
            return new Promise(function(resolve, reject) {
                log.info("LIST MY SPS", context, entities);
                context.done = true;
                resolve(context);
            });
        },
        done({context}) {
            return new Promise(function(resolve, reject) {
                context.done = true;
                resolve(context);
            });
        }
    };

    return actions;
};

MessageRoute.prototype.init = function (params) {
    var route = this;

    data = {
        inputMessageLabel : "How can I help you?",
        suggestedActions : [
        ]
    };

    if(route.socket.me.administrator) {
        data.suggestedActions.push({
            text : "Init carecells",
            command : "app:admin:cell:init",
            params : {}
        });
    }

    route.emit("initResponse", null, data, params.requestId);
};

MessageRoute.prototype.receiveMO = function (params) {
    var route = this;
    log.info("MO", params.message);

    // Let's forward the message to the Wit.ai Bot Engine
    // This will run all actions until our bot has nothing left to do
    route.wit.runActions(
        route.session.id, // the user's current session
        params.message, // the user's message
        route.session.context // the user's current session state
    ).then((context) => {
        // Our bot did everything it has to do.
        // Now it's waiting for further messages to proceed.
        console.log('Waiting for next user messages', context);

        // Based on the session state, you might want to reset the session.
        // This depends heavily on the business logic of your bot.
        // Example:
        // if (context['done']) {
        //   delete sessions[sessionId];
        // }

        if(context['done']) {
            route.session = {
                id : route.socket.sessionId + "-" + new Date().getTime(),
                context: {}
            };
        } else {
            // Updating the user's current session state
            route.session.context = context;
        }
    }).catch((err) => {
        console.error('Oops! Got an error from Wit: ', err.stack || err);
    });
};

module.exports = MessageRoute;