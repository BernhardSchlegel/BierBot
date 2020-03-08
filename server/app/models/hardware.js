// load the things we need
var mongoose = require('mongoose');

// define the schema for our hardware model
var hardwareSchema = mongoose.Schema({
   name: String,
   description: {
      dede: String, // description on german
      enen: String // description on english
   },
   pd: {
      manual: Boolean, // adaptation disabled
      kd: Number, // parameter of pid controller
      kp: Number, // parameter of pid controller
      hysteresis: Number // controlling the hysteris before turning on again
   }
});

// create the model for users and expose it to our app
module.exports = mongoose.model('hardware', hardwareSchema);
