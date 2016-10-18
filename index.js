const Bunyan = require('bunyan');
const FS = require('fs');
const Mongoose = require('mongoose');
const Redis = require('redis');
const SocketIO = require('socket.io');
const SocketIORedis = require('socket.io-redis');
const Vasync = require('vasync');

const log = Bunyan.createLogger({ name : 'tikva:index' });

const mode = process.env.MODE ? process.env.MODE : "local";
PROPERTIES = JSON.parse(FS.readFileSync('./resources/properties.json', 'utf8'))[mode];
log.info(mode, PROPERTIES);

var installed = JSON.parse(FS.readFileSync('./resources/installed.json', 'utf8')).installed;
log.info("installed", installed);

Mongoose.connect(PROPERTIES.mongodb); //connect to mongodb
var redis = Redis.createClient(PROPERTIES.redis.url); //connect to to redis server

const io = SocketIO(3000);
io.adapter(SocketIORedis({ pubClient: redis, subClient: redis }));

io.on('connection', function (socket) {
    log.info("ON CONNECTED");

    if(!installed) {
        log.info("INSTALLATION MODE");
        socket.emit("install", {
            installed : false
        });
    }

    socket.on('disconnect', function () {
        log.info("ON DISCONNECTED");
    });
});

log.info("TIKVA is listening to port 3000");