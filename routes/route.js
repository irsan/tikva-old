const Response = require('../util/response');

function Route(socket) {
    this.socket = socket;
}

Route.prototype.emit = function (responseType, error, data, requestId) {
    var response = new Response(requestId);
    if (error) {
        response.fail(error);
    } else {
        response.data = data;
    }

    this.socket.emit("tikva:" + this.moduleName + ":" + responseType, response);
};

module.exports = Route;