const Bunyan = require('bunyan');
const SocketIO = require('socket.io');
const Vasync = require('vasync');

const log = Bunyan.createLogger({ name : 'tikva:index' });

const io = SocketIO(80);

io.on('connection', function (socket) {
    log.info("ON CONNECTED");

    socket.on('disconnect', function () {
        log.info("ON DISCONNECTED");
    });
});

log.info("TIKVA is listening to port 80");