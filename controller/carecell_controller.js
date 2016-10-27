const Bunyan = require('bunyan');
const Model = require('../models/model');
const Permalinks = require('permalinks');
const S3Util = require('../util/s3_util');
const UUID = require('node-uuid');
const Vasync = require('vasync');

const log = Bunyan.createLogger({ name : 'tikva:controller.CarecellController' });

function CarecellController() {
}

CarecellController.addSP = (carecell, sp, callback) => {
    Vasync.waterfall([
        (callback) => {
            var user = new Model.User({
                name: sp.name,
                mobile: sp.mobile,
                carecell : carecell
            });

            user.save((error, user) => {
                if (error) {
                    return callback(error);
                }

                callback(null, user);
            });
        },
        (user, callback) => {
            if(sp.profileImage) {
                log.info("USERNAME : ", user);
                var fileName = user.name.replace(/\W+/g, "_") + '-' + UUID.v1() + ".jpg";
                log.info("THE FILENAME: ", fileName);
                S3Util.writeBase64("user_profile_image/" + fileName, sp.profileImage, 'image/jpeg', true, function(error, data){
                    if (error) {
                        return callback(error);
                    }

                    user.profileImage = data.Location;
                    user.save((error, user) => {
                        if(error) {
                            return callback(error);
                        }

                        return callback(null, user);
                    })
                });
            } else {
                callback(null, user);
            }
        }
    ], callback);
};

CarecellController.listSP = (carecell, callback) => {
    // Vasync.waterfall([
    //     (callback) => {
    //         Model.
    //     }
    // ], (error, result) => {
    //
    // });
};


module.exports = CarecellController;