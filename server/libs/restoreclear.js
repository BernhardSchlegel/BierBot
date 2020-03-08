var brewlog = require('./brewlog');
var common = require('./common');
var defaults = require('./defaults');
var configDB = require('../config/database.js');
var collections = ["recipes", "logs", "settings", "users", "sessions"]
const mongojs = require("mongojs");
var db = mongojs(configDB.url, collections);
var mongoose = require('mongoose');
mongoose.connect(configDB.url); // connect to our database
var Hardware = require('../app/models/hardware');
//var ReducedLog = require('./app/models/reducedlog');
var Setting = require('../app/models/appsetting');

var exports = module.exports = {};


var clearAllSessions = function(callback) {
   db.sessions.remove({}, function(err, updated) {
      if (err || !updated) brewlog.log("sessions not deleted:" + err);
      else brewlog.log("all sessions cleared.");
   });
};

exports.restoreFactorySettings = function(str) {

   clearAllSessions();
   brewlog.log("restoring default settings...");

   // delete all recips
   db.recipes.remove({}, function(err) {
      if (err) brewlog.log("recipe not deleted:" + err);
      else brewlog.log("all recipes deleted");
   });

   var defaultHardwares = [{
         "description": {
            "enen": "Kühlschrank für Gärung",
            "dede": "Frigde for fermentation"
         },
         "name": "Kühlschrank",
         "pd": {
            "manual": false,
            "kp": 0.9,
            "kd": 2,
            "hysteresis": 0.3
         }
      },
      {
         "description": {
            "dede": "Hendi Induktionskocher mit 3.5kW Heizleistung mit Topf",
            "enen": "Hendi induction plate with 3.5kW heating power with a pot"
         },
         "name": "Hendi 3.5kW",
         "pd": {
            "hysteresis": 0.3,
            "kd": 1.6,
            "kp": 0.99,
            "manual": false
         }
      },
      {
         "description": {
            "dede": "Weck Einkochautomat mit 2kW integrierter Heizleistung",
            "enen": "Weck Pot with a integrated 2kW heating"
         },
         "name": "Weck 2kW",
         "pd": {
            "hysteresis": 0.5,
            "kd": 1.5,
            "kp": 0.99,
            "manual": false
         }
      }
   ];

   var defaultRecipes = [{
         "name": "Hauptgärung",
         "description": "Dieses Rezept ist zur Steuerung des Kühlschranks oder der Gefriertruhe bei der Gärung bestimmt.\n\nDies erfolgt durch Auswählen des \"Kühlen\"-Modus.",
         "lastEdited": "2015-04-12T17:48:36.194Z",
         "mode": "cool",
         "steps": [{
               "name": "Gärung",
               "stirr": false,
               "targetTemperature": 10,
               "timeLimit": 5760,
               "endStepBy": "time"
            },
            {
               "name": "Gärung",
               "stirr": false,
               "targetTemperature": 7,
               "timeLimit": 5760,
               "endStepBy": "time"
            },
            {
               "name": "Diacetyl-Rast",
               "stirr": false,
               "targetTemperature": 15,
               "timeLimit": 1440,
               "endStepBy": "time"
            },
            {
               "name": "Auslagern",
               "stirr": false,
               "targetTemperature": 0,
               "timeLimit": 442800,
               "endStepBy": "never"
            }
         ]
      },
      {
         "name": "Helles",
         "description": "Beispielrezept für ein Helles angelehnt an http://www.maischemalzundmehr.de/index.php?id=101&inhaltmitte=recipe. Hier können zudem Kommentare wie Malz- und Hopfenmengen hinterlegt werden.\n\nGüsse für 24 Ausschlag\nHauptguss: 20  Liter\nNachguss: 13  Liter\n\nPilsner Malz: 2.5 kg (50%)\nWiener Malz: 2.2 kg (44%)\nCarahell®: 0.3 kg (6%)\nGesamtschüttung: 5 kg\n\nMagnum: 8 g, 15% α-Säure, 10min nach Start\nSpalter Select: 16 g, 5.3% α-Säure, 10 min vor Ende\n\nDies erfolgt durch Auswählen des \"Heizen\"-Modus.",
         "lastEdited": "2014-10-13T10:56:41.762Z",
         "mode": "heat",
         "steps": [{
               "name": "Einmaischtemperatur anfahren und halten",
               "stirr": true,
               "targetTemperature": 37,
               "timeLimit": 0,
               "endStepBy": "never"
            },
            {
               "name": "Maischarbeiten",
               "stirr": "false",
               "targetTemperature": 0,
               "timeLimit": 0,
               "endStepBy": "never"
            },
            {
               "name": "Einmaischrast",
               "stirr": true,
               "targetTemperature": 35,
               "timeLimit": 20,
               "endStepBy": "time"
            },
            {
               "name": "Eweisrast",
               "stirr": true,
               "targetTemperature": 55,
               "timeLimit": 15,
               "endStepBy": "time"
            },
            {
               "name": "Beta-Rast (Maltose)",
               "stirr": true,
               "targetTemperature": 63,
               "timeLimit": 30,
               "endStepBy": "time"
            },
            {
               "name": "Alpha-Rast (Verzuckerungsrast)",
               "stirr": true,
               "targetTemperature": 73,
               "timeLimit": 30,
               "endStepBy": "time"
            },
            {
               "name": "Läuterrast (Halten bis Überpumpen in Läuterbottich)",
               "stirr": true,
               "targetTemperature": 78,
               "timeLimit": 20,
               "endStepBy": "time"
            },
            {
               "name": "Abläutern",
               "stirr": true,
               "targetTemperature": 0,
               "timeLimit": 0,
               "endStepBy": "never"
            },
            {
               "name": "Pause (Läuterarbeiten)",
               "stirr": false,
               "targetTemperature": 0,
               "timeLimit": 0,
               "endStepBy": "never"
            },
            {
               "name": "Würzekochen",
               "stirr": false,
               "targetTemperature": 110,
               "timeLimit": 70,
               "endStepBy": "time"
            },
            {
               "name": "Nachbereitung",
               "stirr": false,
               "targetTemperature": 0,
               "timeLimit": 0,
               "endStepBy": "never"
            }
         ]
      }
   ];

   var hardwareSelected = false;
   Hardware.remove(function(err) {
      if (err) {
         brewlog.log("failed deleting all hardwares: " + err);
      } else {
         brewlog.log("all hardwares deleted");
         defaultHardwares.forEach(function(elem, idx, array) {
            common.upsertHardware(elem, function(err, upsertedHardware) {
               if (err) {
                  brewlog.log('failed to upsert hardware: ' + err);
               } else {
                  brewlog.log("added hardware #" + (idx + 1));

                  if (hardwareSelected == false) {
                     hardwareSelected = true;
                     brewlog.log("selecting first hardware...");
                     // add first hardware to app settings
                     Hardware.findOne(function(err, hw) {
                        if (err) {
                           brewlog.log('failed getting new hardware:' + err);
                        } else {
                           brewlog.log("reveived hardware from database.");
                           var defaultSettings = defaults.defaultSettings;
                           defaultSettings.selectedHardware = hw._id;

                           Setting.findOne(function(err, appSettings) {
                              if (err) {
                                 callback(err, null);
                              } else {
                                 Hardware.find(function(err, hardwares) {
                                    if (err) {
                                       callback(err, null);
                                    } else {
                                       if (appSettings == null) {
                                          brewlog.log("no settings found, creating default...");
                                          appSettings = defaultSettings;
                                       }
                                       for (var k in defaultSettings) {
                                          brewlog.log("replacing key=" + k);
                                          appSettings[k] = defaultSettings[k];
                                       }

                                       common.updateAppSettings(appSettings, function(err, updatedSettings) {
                                          brewlog.log("updateAppSettings callback.");
                                          if (err) {
                                             brewlog.log('failed updating app settings:' + err);
                                          } else {
                                             brewlog.log('selected new hardware: ' + hw.name);


                                             common.addRecipe(defaultRecipes[0], function(err, recipe) {
                                                if (err) {
                                                   brewlog.log("failed adding recipe: " + err);
                                                } else {
                                                   common.addRecipe(defaultRecipes[1], function(err, recipe) {
                                                      if (err) {
                                                         brewlog.log("failed adding recipe: " + err);
                                                      } else {
                                                         brewlog.log("closing db");
                                                         closeDb();
                                                         process.exit();
                                                      }
                                                   });
                                                }
                                             });

                                          }
                                       })
                                    }
                                 });
                              }
                           });
                        }
                     });
                  }
               }
            });
         });
      }
   });
};

var closeDb = function() {
   mongoose.connection.close();
}

exports.clearAllSessions = clearAllSessions;
exports.closeDb = closeDb;
