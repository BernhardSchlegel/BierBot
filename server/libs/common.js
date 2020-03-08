var brewlog = require('./brewlog');
var brewdate = require('./brewdate');
var hostname = require('./hostname');
var configDB = require('../config/database.js');
var mongoose = require('mongoose');
mongoose.connect(configDB.url); // connect to our database
var Hardware = require('../app/models/hardware');
var Setting = require('../app/models/appsetting');
var collections = ["recipes"]
const mongojs = require("mongojs");
var db = mongojs(configDB.url, collections);

var addRecipe = function(recipe, callback) {
   db.recipes.save(recipe, function(err, saveRecipe) {
      if (err || !saveRecipe) {
         brewlog.log('recipe not inserted, error: ' + err);
         callback('recipe not inserted, error: ' + err, null);
      } else {
         brewlog.log('recipe ' + saveRecipe.name + ' (id: ' + saveRecipe._id + ') saved');
         callback(null, saveRecipe); // validate, is there a _id?
      }
   });
}

var updateAppSettings = function(settings, callback) {
   // create object if it is a schema
   if (settings.toObject) {
      settings = settings.toObject();
   }

   // get the _id since _id cannot be replaced in mongoDB
   var id = settings._id

   // remove from old object
   delete settings._id;
   delete settings.__v;

   // Do the upsert, which works like this: If no Contact document exists with
   // _id = contact.id, then create a new doc using upsertData.
   // Otherwise, update the existing doc with upsertData
   Setting.update({
      _id: id
   }, settings, {
      upsert: true
   }, function(err, report) {
      // report looks like {"ok":1,"n":1,"nModified":1}
      if (err) {
         brewlog.log('failed to update settings: ' + err);
         callback(err);
      } else {
         hostname.changeHostname('BierBot ' + settings.bierBotName);

         callback(null, settings);
      }
   });

};

// callback (err, hardware)
var upsertHardware = function(hardware, callback) {
   var upsertVal = false;
   if (hardware._id == null) {
      brewlog.log('generating new id for (' + hardware.name + ')');
      // if there is no ID, reassign it
      var newHardware = new Hardware({});
      // assign hardware has the _v and _id fields...
      for (var k in hardware) newHardware[k] = hardware[k];
      // has to be done this way cause methods are not copied
      hardware = newHardware.toObject();

      upsertVal = true;
   }

   // get the _id since _id cannot be replaced in mongoDB
   var id = hardware._id;

   // remove from old object
   delete hardware._id;

   // Do the upsert, which works like this: If no Contact document exists with
   // _id = contact.id, then create a new doc using upsertData.
   // Otherwise, update the existing doc with upsertData
   Hardware.update({
      _id: id
   }, hardware, {
      upsert: upsertVal
   }, function(err, numberAffected) {
      if (err) {
         brewlog.log('failed to update hardware: ' + err);
         callback(err);
      } else {
         hardware._id = id; // reassign
         brewlog.log('updated hardware (' + hardware.name + ')');
         callback(null, hardware);
      }
   });
}

exports.upsertHardware = upsertHardware;
exports.updateAppSettings = updateAppSettings;
exports.addRecipe = addRecipe;
