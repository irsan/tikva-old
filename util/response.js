function Response() {
    this.status = "Ok";
    this.message = "Success";
};

Response.prototype.fail = function(message) {
    this.status = "Failed";
    this.message = message;
};

module.exports = Response;