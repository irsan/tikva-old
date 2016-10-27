const Bunyan = require('bunyan');
const FS = require('fs');
const Mongoose = require('mongoose');
const Redis = require('redis');
const S3Util = require('./util/s3_util');
const SocketIO = require('socket.io');
const SocketIORedis = require('socket.io-redis');
const Vasync = require('vasync');


const AdminRoute = require('./routes/admin_route');
const CommandRoute = require('./routes/command_route');
const Installer = require('./routes/installer');
const LoginRoute = require('./routes/login_route');
const MessageRoute = require('./routes/message_route');

const log = Bunyan.createLogger({ name : 'tikva:index' });

const mode = process.env.MODE ? process.env.MODE : "local";
PROPERTIES = JSON.parse(FS.readFileSync('./resources/properties.json', 'utf8'))[mode];
log.info(mode, PROPERTIES);

Mongoose.Promise = global.Promise;
Mongoose.connect(PROPERTIES.mongodb); //connect to mongodb
var redis = Redis.createClient(PROPERTIES.redis.url); //connect to to redis server

S3Util.initS3(PROPERTIES.aws.s3);

const io = SocketIO(3000);
io.adapter(SocketIORedis({ pubClient: redis, subClient: redis }));

io.on('connection', function (socket) {
    log.info("ON CONNECTED");

    var installer = new Installer();
    installer.init(socket, (error, installed) => {
        if(!installed) {
            installer.start();
        } else {
            new LoginRoute(socket).start((error, result) => {
                log.info("AFTER LOGIN", error, result);
                if(!error) {
                    if(socket.me.administrator) {
                        new AdminRoute(socket).start();
                    }

                    new CommandRoute(socket).start();
                    new MessageRoute(socket).start();
                }
            });
        }
    });

    socket.on('disconnect', function () {
        log.info("ON DISCONNECTED");
    });
});

log.info("TIKVA is listening to port 3000");