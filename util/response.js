function Response(requestId) {
    this.status = "Ok";
    this.message = "Success";
    if(requestId) {
        this.requestId = requestId;
    }
};

Response.prototype.fail = function(message) {
    this.status = "Failed";
    this.message = message;
};

module.exports = Response;