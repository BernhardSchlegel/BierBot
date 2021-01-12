// set up ======================================================================
// get all the tools we need
var port = process.env.PORT || 80;
var http = require('http');
var express = require('express'),
   app = module.exports.app = express();
var cookie = require('cookie'); // #OSS delete if it works without it
var connect = require('connect');

var server = http.createServer(app);
var io = require('socket.io')(server); //pass a http.Server instance
server.listen(port); //listen on port
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var util = require('util'); // util.inspect(updatedRecipe, false, null)
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// var redisStore			= require('connect-redis')(session);
// var sessionStore = new redisStore();
var passportSocketIo = require("passport.socketio");
var configDB = require('./config/database.js');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var sessionStore = new MongoStore({
   url: configDB.url
});
var telegram = require('./telegram');
// old BierBot stuff follows:
var socket = require('socket.io');
var busboy = require('connect-busboy'); //middleware for form/file upload
var formidable = require('formidable');
var path = require('path'); //used for file path
var fs = require('fs-extra'); //File System - for file manipulation
var fsbase = require('fs');
var sensor = require('ds18x20'); // using https://www.npmjs.org/package/ds18x20
const Gpio = require('pigpio').Gpio;
var nodemailer = require('nodemailer'); // sending emails
var cpuinfo = require('./libs/cpuid');
var brewdate = require('./libs/brewdate');
var defaults = require('./libs/defaults');
var PD = require('./libs/pd');
var version = require('./libs/version');
var common = require('./libs/common');
version.chmod();
var hostname = require('./libs/hostname');
var brewlog = require('./libs/brewlog.js');
var restoreclear = require('./libs/restoreclear.js');
var plausible = require('./libs/plausible.js');
var cors = require('cors'); // enable cross site requests
var morgan = require('morgan');
var exec = require('child_process').exec;

// create necessary folders
var dir = '../logs';
if (!fs.existsSync(dir)) {
   fs.mkdirSync(dir);
}

// the wifi stuff
var iwlist = require('wireless-tools/iwlist'); //The iwlist command is used to get detailed information from a wireless interface. query e.g. available networks
var ifconfig = require('wireless-tools/ifconfig');
var udhcpc = require('wireless-tools/udhcpc'); //The udhcpc command is used to configure a dhcp client for a network interface.
var wpa_supplicant = require('wireless-tools/wpa_supplicant'); // The wpa_supplicant enable command is used to join a wireless network on a specific network interface.
var iwconfig = require('wireless-tools/iwconfig');

// database ===================================================================
//var databaseUrl = "brewdb"; // "username:password@example.com/mydb"
var collections = ["recipes", "logs", "settings", "users", "sessions"];
// recipes: holding all recipes
// brews: 	holding past brews
// state: 	holding state info (to be independent from browser data) as
//			well as settings
const mongojs = require("mongojs");
//var db = mongojs(configDB.url, collections);
var db = mongojs(configDB.url, collections);

var Hardware = require('./app/models/hardware');
//var ReducedLog = require('./app/models/reducedlog');
var Setting = require('./app/models/appsetting');

var bierBotState = {
   wifiAvailable: false, // is the wifi adapter availalbe
   wifiConnected: false,
   availableWifiNetworks: null, // { address: '3c:a8:2a:c5:06:ee',
   //   channel: 10,
   //   frequency: 2.457,
   //   mode: 'master',
   //   quality: 72,
   //   signal: 7,
   //   ssid: 'DIRECT-ED-HP OfficeJet 3830',
   //   security: 'wpa2' } ]
   wifiSignalStrength: null
};

restoreclear.clearAllSessions();

var speed = 1; // if true, twice as fast
var beepShort = function(finishedCallback) {
   pinAudio.digitalWrite(1);
   setTimeout(function() {
      pinAudio.digitalWrite(0);
      setTimeout(function() {
         if (finishedCallback != null) {
            finishedCallback();
         }
      }, 50 / speed);
   }, 100 / speed);
};

var beepLong = function(finishedCallback) {

   pinAudio.digitalWrite(1);
   setTimeout(function() {
      pinAudio.digitalWrite(0);
      setTimeout(function() {
         if (finishedCallback != null) {
            finishedCallback();
         }
      }, 50 / speed);
   }, 200 / speed);
};

var beepPause = function(finishedCallback) {

   setTimeout(function() {
      if (finishedCallback != null) {
         finishedCallback();
      }
   }, 100 / speed);
};


// SOUND
var beepLongShort = function() {

   beepLong(function() {
      beepShort();
   });
};

var beepShortLong = function() {

   beepShort(function() {
      beepLong();
   });

};

var beepMorseBeer = function() {
   speed = 1;
   beepLong(function() {
      beepShort(function() {
         beepShort(function() {
            beepShort(function() {
               beepPause(function() {
                  beepShort(function() {
                     beepShort(function() {
                        beepPause(function() {
                           beepShort(function() {
                              beepPause(function() {
                                 beepShort(function() {
                                    beepLong(function() {
                                       beepShort(function() {
                                          speed = 1;
                                       });
                                    });
                                 });
                              });
                           });
                        });
                     });
                  });
               });
            });
         });
      });
   });
};

var beepLongLongLong = function() {

   pinAudio.digitalWrite(1);
   setTimeout(function() {
      pinAudio.digitalWrite(0);
      setTimeout(function() {
         pinAudio.digitalWrite(1);
         setTimeout(function() {
            pinAudio.digitalWrite(0);
            setTimeout(function() {
               pinAudio.digitalWrite(1);
               setTimeout(function() {
                  pinAudio.digitalWrite(0);
                  setTimeout(function() {

                  }, 50);
               }, 200);
            }, 50);
         }, 200);
      }, 50);
   }, 200);
};

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database
require('./config/passport')(passport); // pass passport for configuration
var debugMode = false; // temp sensor will be simulated
// wifi will not be set
var DEBUG_DO_NOT_ALTER_WIFI = false;

// express setup ==============================================================
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({
   extended: true
}));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
var sessionSecret = 'jfEpaRnbmQQNlgnjhZdpm-TFxLH_dB';
app.use(session({
   key: 'express.sid',
   store: sessionStore,
   secret: sessionSecret,
   cookie: {
      path: '/',
      httpOnly: true,
      secure: false,
      maxAge: 604800000
   }
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


// ID & update =====================================
var updateAvailable = false;
var updateAvailableVersion = null;
var updateInProgress = false;
var updateFilePath = null;
var cpuid = 'default';
cpuinfo.on('update', function(id) {
   cpuid = id;
   brewlog.log('serial (cpuid): ' + util.inspect(cpuid, false, null));

   version.init(cpuid, function(file, version) {
      // new version available
      updateAvailable = true;
      updateAvailableVersion = version;
      updateFilePath = file;
   }, function() {
      // finalized update callback, e.g. applying changes to database
      brewlog.log("finalizing update callback called");

      brewlog.log('restarting ...');
      var process = exec('sudo shutdown -r now');
   });
});
cpuinfo.update();

// create settings for first start
Setting.findOne(function(err, appSettings) {
   if (err) {
      brewlog.error("FATAL");
      brewlog.error(err);
   } else {
      if (appSettings == null) {
         brewlog.log("No settings found. BierBot presumably started for first time");
         brewlog.log("creating settings...");
         // store the brew to the db
         db.settings.save(defaults.defaultSettings, function(err, saved) {
            if (err || !saved) {
               brewlog.error("failed creating settings: " + err);
            } else {
               brewlog.log("successfully created settings!");
            }
         });
      }
   }
});

var addToSensorValBuffer = 0;
var motorWarningCheckedBuffer = false;
Setting.findOne(function(err, appSettings) {
   brewlog.log("found settings. checking hardware revision...");

   // dont remove the following 3 lines - needed after update !!
   if (appSettings.addToSensorVal != null) {
      addToSensorValBuffer = appSettings.addToSensorVal;
   }

   if (appSettings.motorWarningChecked != null) {
      motorWarningCheckedBuffer = appSettings.motorWarningChecked;
   }

   if (err) {
      brewlog.log('error getting settings: ' + err);
   } else {
      if (appSettings.hardwareRevision == null ||
         appSettings.addToSensorVal == null) {
         brewlog.log("hardwareRevision or addToSensorVal not present, adding \"rev1.0\"...");
         appSettings.hardwareRevision = "rev1.0";
         appSettings.addToSensorVal = addToSensorValBuffer;

         common.updateAppSettings(appSettings, function(err, updatedSettings) {
            if (err) {
               brewlog.log('updating settings failed: ' + err);
               callback('updating settings failed: ' + err, null);
            } else {
               brewlog.log("updated app settings and added \"rev\"");
            }
         });
      } else {
         brewlog.log("hardwareRevision present: " + appSettings.hardwareRevision);
         hardwareRevision = appSettings.hardwareRevision
      }
   }
});

var statisticsIntervalID = null;

var iwlistWrapper = function(callback) {

   iwlist.scan('wlan0', function(err, networks) {
      if (err) {
         var err = "error getting WiFi list: " + err;
         brewlog.log(err);
         callback(err);
      }
      brewlog.log("WiFi list received.");
      bierBotState.networks = networks;
      callback(null);
   });
};

var scanForWifiNetworks = function(callback) {
   const adapterName = 'wlan0';

   // check if wifi is already up
   ifconfig.status(adapterName, function(err, status) {
      if (status.up == true) {
         brewlog.log("interface " + adapterName + " is already up");
         iwlistWrapper(callback);
      } else {
         brewlog.log("interface " + adapterName + " not up, changing that...");

         // although wrong, ipv4_XXX stuff must be provided
         var options = {
            interface: 'wlan0',
            ipv4_address: '192.168.10.1',
            ipv4_broadcast: '192.168.10.255',
            ipv4_subnet_mask: '255.255.255.0'
         };

         ifconfig.up(options, function(err) {
            if (err) {
               var err = "error brining wlan0 up: " + err;
               brewlog.log(err);
               callback(err);
            } else {
               // Interface is upsetTimeout(function(){
               brewlog.log('waiting 10s before scanning (ressource busy)')
               setTimeout(function() {
                  iwlistWrapper(callback);
               }, 30000); // 2000 is no longer enough for the new pi 2 b
            }
         });

      }
   });
};

var lastWiFiAdapterRestart = 0;
var restartWiFiAdapater = function(finishedCallback) {
   var diffInMs = new Date() - lastWiFiAdapterRestart;
   if (diffInMs < 120000) {
      brewlog.log("last WiFi reset is less than 120s ago. Aborting...")
      return;
   }
   lastWiFiAdapterRestart = new Date();

   // take down wifi interface
   var prcs = exec('sudo ifdown --force wlan0',
      function(error, stdout, stderr) {
         brewlog.log('stdout: ' + stdout);
         brewlog.log('stderr: ' + stderr);
         if (error !== null) {
            console.log('exec error: ' + error);
         }
      }
   );

   prcs.on('close', function(code, signal) {
      brewlog.log('sudo ifdown --force wlan0: done.');
      if (code !== 0) {}

      // take up wifi interface
      var prcsUp = exec('sudo ifup --force wlan0',
         function(error, stdout, stderr) {
            brewlog.log('stdout: ' + stdout);
            brewlog.log('stderr: ' + stderr);
            if (error !== null) {
               console.log('exec error: ' + error);
            }
         }
      );

      prcsUp.on('close', function(code, signal) {
         brewlog.log('sudo ifup --force wlan0: done.');
         finishedCallback();
         if (code !== 0) {}
      });
   });
};

// separate function, since getWifiSignalStrength is only called if wifi is enabled
var getWifiAvailable = function() {
   try {
      var wlanAdapterFound = false;
      ifconfig.status(function(err, ifs) {
         if (!err) {
            ifs.forEach(function(inter, idx, array) {
               brewlog.log("found interface " + inter.interface);
               if (inter.interface.includes('wlan0')) {
                  bierBotState.wifiAvailable = true;
                  wlanAdapterFound = true;
                  brewlog.log("setting WiFi enabled");
               }
            });

            if (wlanAdapterFound == false) {
               bierBotState.wifiAvailable = false;
            }
         }
      });
   } catch (e) {
      brewlog.log("error calling iwconfig:" + e);
   }
};


var getWifiSignalStrength = function() {
   try {
      ifconfig.status(function(err, ifs) {
         if (!err) {
            ifs.forEach(function(inter, idx, array) {
               if (inter.interface.includes('wlan0')) {
                  bierBotState.wifiAvailable = true;
                  iwconfig.status(function(err, status) {
                     if (Array.isArray(status)) {
                        status = status[0];
                     }

                     if (err) {
                        brewlog.log("error getting wifi / signal status: " + err);
                     }

                     //brewlog.log("iwconfig return val is:" + util.inspect(status, false, null) );
                     //brewlog.log("wifi.signal=" +status.signal);

                     if (status.signal == 0) {
                        brewlog.log("connection lost... restarting wifi adapter...")
                        restartWiFiAdapater(function() {
                           brewlog.log("wifi adapter restarted because of connection loss.");
                        });
                     }

                     bierBotState.wifiSignalStrength = status.quality;
                  });
               }
            });
         }
      });
   } catch (e) {
      brewlog.log("error calling iwconfig:" + e);
   }
};
var getWifiSignalStrengthIntervall = null;

// Networking
var oldWifiSettings = {
   pw: "",
   ssid: "",
};
var wifiWatchdogIntervall = null;
var wifiWatchdogIntervallHour = 0;

var updateNetworking = function(settings) {

   if (settings.wifiEnabled && debugMode == false) {
      if (oldWifiSettings.pw == settings.wlanPassphrase &&
         oldWifiSettings.ssid == settings.wlanSSID) {

         brewlog.log("skipping update of WiFi settings due to lack of change.");
      } else {
         oldWifiSettings.pw = settings.wlanPassphrase;
         oldWifiSettings.ssid = settings.wlanSSID;
      }

      // g is for multi matches
      var re = new RegExp('.', 'g');
      var pwEncrypted = settings.wlanPassphrase.replace(re, "X");
      brewlog.log('updating wifi settings (' + settings.wlanSSID + ',' + pwEncrypted + ')...');


      if (getWifiSignalStrengthIntervall != null) {
         clearInterval(getWifiSignalStrengthIntervall);
         getWifiSignalStrengthIntervall = null;
      }

      getWifiSignalStrengthIntervall = setInterval(function() {
         getWifiSignalStrength();
      }, 30 * 1000);


      if (wifiWatchdogIntervall != null) {
         clearInterval(wifiWatchdogIntervall);
         wifiWatchdogIntervall = null;
      }

      wifiWatchdogIntervall = setInterval(function() {
         wifiWatchdogIntervallHour = wifiWatchdogIntervallHour + 1;

         if (wifiWatchdogIntervallHour == 24) {
            brewlog.log("wifi watchdog awakened!");

            restartWiFiAdapater(function() {
               brewlog.log("wifi adapter restarted through watchdog!");
            });

            wifiWatchdogIntervallHour = 0;
         } else {
            brewlog.log("hours remaining until wifi watchdog awakens: " + (24 - wifiWatchdogIntervallHour));
         }
      }, 1000 * 60 * 60);

      scanForWifiNetworks(function(err) {
         if (!err) {
            var security = null;
            brewlog.log("scan for WiFi networks completed.");

            if (!Array.isArray(bierBotState.networks)) {
               brewlog.log("no networks. no array.");
               return;
            }

            brewlog.log('discovered networks: ' + util.inspect(bierBotState.networks, false, null));


            bierBotState.networks.forEach(function(elem, idx, array) {
               //brewlog.log("checking "+ elem.ssid + "...");
               if (elem.ssid == settings.wlanSSID) {
                  security = elem.security;
                  brewlog.log("security of " + settings.wlanSSID + " is " + security);
               }
            });


            if (security != null) {

               var encryption = null;

               if (security.toLowerCase() == 'wep') {
                  encryption = 'WEP';
               } else if (security.toLowerCase() == 'open') {
                  encryption = 'Open';
               } else {
                  encryption = 'WPA';
               }

               brewlog.log('going with encryption=' + encryption + "...");

               var command = "sudo ../sys/w.sh \"" + settings.wlanSSID + "\" " +
                  encryption + " " + settings.wlanPassphrase + "";

               // g is for multi matches
               var re = new RegExp('.', 'g');
               var pwEncrypted = settings.wlanPassphrase.replace(re, "X");
               var commandLog = "sudo ../sys/w.sh \"" + settings.wlanSSID + "\" " +
                  encryption + " " + pwEncrypted + "";
               brewlog.log('executing \"' + commandLog + '\"...');

               // execute command
               var processRestart = exec(command,
                  function(error, stdout, stderr) {
                     brewlog.log('stdout: ' + stdout);
                     brewlog.log('stderr: ' + stderr);
                     if (error !== null) {
                        console.log('exec error: ' + error);
                     }
                  }
               );

               processRestart.on('close', function(code, signal) {
                  brewlog.log('done...');
                  getWifiSignalStrength();
                  if (code !== 0) {}
               });
            } else {
               brewlog.log("security is null. aborting...;");
            }
         }
      });
   } else {
      if (!DEBUG_DO_NOT_ALTER_WIFI) {
         // take down wifi interface
         var prcs = exec('sudo ifdown --force wlan0',
            function(error, stdout, stderr) {
               brewlog.log('stdout: ' + stdout);
               brewlog.log('stderr: ' + stderr);
               if (error !== null) {
                  console.log('exec error: ' + error);
               }
            }
         );

         prcs.on('close', function(code, signal) {
            brewlog.log('sudo ifdown --force wlan0: done.');
            if (code !== 0) {}
         });
      }
   }
};

// heating cooling =============================================================
// heating cooling supports only on/off)
var heatingCoolingResetMode = false;
var heatCool = function(targetState) {
   if (heatingState != targetState) {
      brewlog.log('setting heating cooling ...' + targetState);
      pinHeatingCooling.digitalWrite(targetState);
      heatingState = targetState;
      addLogToCurrentBrew(function(err) {}, null, null, null, null, heatingState); //  addLogToCurrentBrew = function(callback,temp, stirr, step, comment, heating) {
   }
};
var safeModeHeatingCoolingWarned = false;
var setHeatingCooling = function(targetState) {
   if (heatingCoolingResetMode == true) {
      brewlog.log("skipping setHeatingCooling since heatingCoolingResetMode=true and force=false...");
      return;
   }
   if (safeModeActive == true) {
      if (safeModeHeatingCoolingWarned == false) {
         brewlog.log("skipping setHeatingCooling since safeModeActive=true...");
         safeModeHeatingCoolingWarned = true;
      }
      return;
   }
   safeModeHeatingCoolingWarned = false;
   heatCool(targetState);
};
var switchHeatingCooling = function() {
   if (heatingState == 0)
      heatCool(1);
   else
      heatCool(0);
};

var setHeatingCoolingResetMode = function(enable) {
   heatingCoolingResetMode = enable;
   brewlog.log("heatingCoolingResetMode changed to " + heatingCoolingResetMode);
};

// routes ======================================================================
var restore = function() {


   finishAutoMode(function() {

      brewlog.log("attempting to delete maybe exisiting current brew (just in case)...");

      // delete (all, although there only should be one) current brews
      db.logs.remove({
         currentBrew: true
      }, function(err, result) {

         if (err) {
            brewlog.log("error deleting current brew: " + err);
         } else {
            brewlog.log("deleted current brew.");
         }
      });
   });

   restoreclear.restoreFactorySettings();
};
var routeSettings = {
   passwordDisabled: false,
};
var brewRoutes = null;
Setting.findOne(function(err, appSettings) {
   if (err) {
      brewlog.log('error getting settings: ' + err);
   } else {
      updateNetworking(appSettings);
      routeSettings.bierBotname = appSettings.bierBotName;
      routeSettings.cpuid = cpuid;
      brewdate.setBierBotDate(appSettings.manualTime);
      brewdate.setUsingSystemDate(!appSettings.manualSetTime);
      PD.setBrewDateAsync(brewdate);
      brewlog.setBrewDateAsync(brewdate);

      brewRoutes = require('./app/routes.js')(app, express, passport,
         routeSettings, cors, switchHeatingCooling,
         setHeatingCoolingResetMode, restore); // load our routes and pass in our app and fully configured passport
      brewlog.log("brewRoutes initialized.");
   }
});

// authentificating socket.io ==================================================;
io.use(function(socket, next) {
   if (socket.request.headers.cookie) {
      // save parsedSessionId to handshakeData
      socket.cookie = cookie.parse(socket.request.headers.cookie);
      socket.sessionId = cookieParser(socket.cookie['connect.sid'], sessionSecret);
   }
   next(null, true);
});
// launch ======================================================================
var MAIN_INTERVAL_TIME = 1000; // BE EXTREMELY CAREFULL WITH CHANGING THIS SETTING
morgan('combined', {
   skip: function(req, res) {
      return res.statusCode < 400
   }
});
brewlog.log("Server started and listen to http://127.0.0.1:" + port);
setTimeout(function() {
   beepLongShort();
   getWifiAvailable();
}, 10000);



// own, global vars
var firstSensorID = null; // hold the ID of the first temperature sensor: BrewInner or fridge
var forceControl = false; // forces the control to take action once
var safeModeActive = false; // if this is true, pwm and heating cannot be turned on until
// set next step, recipe started or manual control event happened
var firstTempCelsius = null; // holds the most current temperature in celsius
var controlState = {
   targetTemperature: null,
   stirr: false,
   mode: 'heat', // 'heat' or 'cool'
   auto: false, // false => manualMode, true => autoMode
};

var tempControlConfig = {
   currentDeltaT: 0,
};

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
   service: 'Gmail',
   auth: {
      user: 'gmail.user@gmail.com',
      pass: 'userpass'
   }
});

// GPIO section
// mapping is sometimes confusing
// - http://abyz.me.uk/rpi/pigpio/
// - https://pimylifeup.com/raspberry-pi-pinout/
const pinNumberHeatingCooling = 17; // = Pin 11 = WiPiPin 0 = Pin11 = GPIO0 = BCM17
const pinNumberMotor = 18; // = Pin12 = GPIO1 = BCM18 (PWM enabled)
const pinNumberTemperaturePlugDetection = 27; // Pin 13 = WiPiPin2 = GPIO2 = BCM17
const pinNumberAudio = 22; // Pin 15 = WiPiPin3 = GPIO22

const pinHeatingCooling = new Gpio(pinNumberHeatingCooling, {
   mode: Gpio.OUTPUT
});
const pinMotor = new Gpio(pinNumberMotor, {
   mode: Gpio.OUTPUT,
   pullUpDown: Gpio.PUD_DOWN
});
const pinTemperaturePlugDetection = new Gpio(pinNumberTemperaturePlugDetection, {
   mode: Gpio.INPUT,
   pullUpDown: Gpio.PUD_DOWN,
   edge: Gpio.EITHER_EDGE
});
const pinAudio = new Gpio(pinNumberAudio, {
   mode: Gpio.INPUT
});

var motorStatePWM = 0;
var motorTargetStatePWM = 0;
var heatingState = 0;
var pwmOffset = 0;
var setMotorSlowlyIntervalID = null;

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
   var timeout;
   return function() {
      var context = this,
         args = arguments;
      var later = function() {
         timeout = null;
         if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
   };
};

var debouncedISREvent = debounce(function() {
   brewlog.log('debouncedISREvent called... ');
   setTimeout(function() {
      brewlog.log('reiniting temp sensor... ');
      initTemperatureSensor();
   }, 1000);
}, 1500 /* DO NOT send a ,false here, cause (!immediate) will already be true*/ );

setTimeout(function() {
   brewlog.log('setting up ISR delayed (30s)')
   pinTemperaturePlugDetection.on('interrupt', (level) => {
      brewlog.log('temperature plug detection pin changed to LOW (' + level + ')... ');
      debouncedISREvent();
   });
}, 30000); // 2000 is no longer enough for the new pi 2 b

// target state ranges from 0-24 (targetState)
var skipMotorWarned = false; // just for console logging
var motorStatePWMMin = 64;
var setMotor = function(targetStateVolts) {

   if (targetStateVolts != 0 && !motorWarningCheckedBuffer) {
      if (skipMotorWarned == false) {
         brewlog.log("skipping setting motor value since warning hasn't been checked yet...");
      }
      skipMotorWarned = true;
      return;
   }
   if (safeModeActive == true) {
      if (skipMotorWarned == false) {
         brewlog.log("skipping setting motor value since safeModeActive=true...");
      }
      skipMotorWarned = true;
      return;
   }
   skipMotorWarned = false; // reset

   // transform targetStateVolts to PWM value (0-24 to 0-1024)
   if (targetStateVolts < 8 && targetStateVolts != 0) {
      targetStateVolts = 8;
   }
   if (targetStateVolts > 24) {
      targetStateVolts = 24;
   }

   // maps to linear function
   if (targetStateVolts != 0) {
      pwmTargetState = Math.round(motorStatePWMMin + (targetStateVolts - 8) * (255 - motorStatePWMMin) / (24 - 8));
      if (motorStatePWM != pwmTargetState) {
         brewlog.log('pwmTargetState is ' + pwmTargetState + ' targetStateVolts is ' + targetStateVolts);
      }
   } else {
      pwmTargetState = 0;
   }

   if (motorTargetStatePWM != (pwmTargetState)) {

      // clear intervall in case last change wasnt finished
      if (setMotorSlowlyIntervalID != null) {
         clearInterval(setMotorSlowlyIntervalID);
      }

      // set control request
      brewlog.log('setting PWM... ' + pwmTargetState);
      motorTargetStatePWM = pwmTargetState;
      addLogToCurrentBrew(function(err) {}, null, pwmTargetState, null, null); // temp,stirr,step

      // set intervall
      setMotorSlowlyIntervalID = setInterval(function() {
         if (motorTargetStatePWM != motorStatePWM) {
            //brewlog.log('motorTargetStatePWM=' + motorTargetStatePWM + ', motorStatePWM=' + motorStatePWM );
            if (motorTargetStatePWM > motorStatePWM) {
               motorStatePWM++;
            } else if (motorTargetStatePWM < motorStatePWM) {
               motorStatePWM--;
            }

            // set motor to minPWM if value is smaller than minPWM and
            // target is larger
            if (motorStatePWM < motorStatePWMMin && motorTargetStatePWM >= motorStatePWMMin) {
               motorStatePWM = motorStatePWMMin;
            }
            if (motorStatePWM < motorStatePWMMin && motorTargetStatePWM == 0) {
               motorStatePWM = 0;
            }

            pinMotor.pwmWrite(motorStatePWM);
         } else {
            clearInterval(setMotorSlowlyIntervalID);
            brewlog.log('motor value changed to ' + motorStatePWM);
         }
      }, 5);
   }
};


// share this function with the control
PD.setup(setHeatingCooling);

io.sockets.on('connection', function(socket) {

   // Secure
   // reference to my initialized sessionStore in app.js
   var sessionId = socket.sessionId;
   brewlog.log("sessionID is : " + sessionId);
   //brewlog.log("socket.request is : " + util.inspect(socket.request, false, null));

   sessionStore.get(sessionId, function(err, session) {
      if ((routeSettings.passwordDisabled === true) || (!err && session)) {
         if (true /*(routeSettings.passwordDisabled === true) || (session.passport.user)*/ ) { // always grant socket access TODO improve: Why is session.passport.user sometimes not set?

            if (session && session.passport && session.passport.user) {
               brewlog.log('granting socket access to user with id: ' + session.passport.user);
               brewlog.log('sessioninfo:' + util.inspect(session, false, null) + ')');
            } else if (routeSettings.passwordDisabled === false) {
               brewlog.log('password protection enabled - granting socket access to unknown user');
            } else {
               brewlog.log('password protection disabled- granting socket access to unknown user');
            }

            // start (secured)
            var address = socket.handshake.address;
            brewlog.log('client connected! (' + socket.request.connection.remoteAddress + ')');
            var sessionStart = brewdate.gcd();

            socket.on('disconnect', function(socket) {
               var diff = Math.abs(brewdate.gcd() - sessionStart);
               var loggedInMinutes = Math.floor((diff / 1000) / 60);
               brewlog.log('client disconnect! (connected for ' + loggedInMinutes + 'min.)');

               // clear guiUpdate intervall
               clearInterval(tempUpdateIntervalID);
            });

            // setTimeout(function() {
            //     socket.emit('hello', 'guest ' + guestNumber);
            //     brewlog.log('socket emitted!');
            //     guestNumber = guestNumber +1
            // }, MAIN_INTERVAL_TIME);

            // notify GUI over changed "physics" like temperature, switch states etc.
            var tempUpdateIntervalID = setInterval(function() {
               socket.emit('physicUpdate', {
                  'firstTemp': firstTempCelsius,
                  'deltaCperMin': PD.deltaCperMin,
                  'heatingCooling': heatingState,
                  'stirr': motorStatePWM
               });
            }, MAIN_INTERVAL_TIME);

            // gets all recipes
            socket.on('getAllRecipes', function(data, callback) {
               db.recipes.find({}).toArray(function(err, items) {
                  callback(false, {
                     response: items
                  });
                  brewlog.log('getAllRecipes: ' + items.length + ' recipes sent.');
               });
            });

            socket.on('installUpdate', function(data, callback) {
               updateInProgress = true;
               io.sockets.emit('startingUpdate', false);
               if (updateAvailable == true && updateFilePath != null) {
                  version.installUpdate(updateFilePath, function(err) {
                     // update finished callback

                     brewlog.log('triggering update finished socket ...');
                     io.sockets.emit('updateFinished', err); // to all including self

                  });

               }
            });

            // gets all logs
            socket.on('getAllLogsOverview', function(data, callback) {

               var fieldSubset = {
                  name: 1,
                  description: 1,
                  lastEdited: 1,
                  sudSizeLitres: 1,
                  mode: 1,
                  currentBrew: 1,
                  currentStep: 1,
                  sudNumber: 1,
                  basedOn: 1,
                  loaded: 1,
                  started: 1,
                  finished: 1,
               }

               brewlog.log('getting all logs ...');
               // get only a subset of fields
               db.logs.find({
                  currentBrew: false
               }, fieldSubset).toArray(function(err, items) {
                  if (!err) {
                     brewlog.log('found ' + items.length + ' logs.');
                     // assemble return array, holds everything but the logarray itself
                     items.forEach(function(elem, idx, array) {
                        elem.logs = [];
                     })

                     callback(false, items);
                     brewlog.log('getAllLogs: ' + items.length + ' logs sent.');
                  } else {
                     callback(true, null);
                     brewlog.log('getAllLogs failed: ' + err);
                  }
               });
            });

            // gets a recipe by id, recipe needs to be stored first before id is valid
            socket.on('getLogByID', function(id, callback) {
               getLog(id, callback);
            });

            // gets a recipe by id, recipe needs to be stored first before id is valid
            socket.on('getRecipeById', function(id, callback) {
               getRecipe(id, callback);
            });

            // gets a recipe by id, recipe needs to be stored first before id is valid
            socket.on('requestReboot', function(empty, callback) {
               brewlog.log('reboot requested. rebooting ...');
               callback(false, 'rebooting');
               var processRestart = exec('sudo shutdown -r now');
            });

            socket.on('updateSettings', function(incoming, callback) {

               // update wifi settings if wifi is selected
               updateNetworking(incoming.settings);

               common.updateAppSettings(incoming.settings, function(err, updatedSettings) {
                  brewlog.log(JSON.stringify(updatedSettings));

                  if (err) {
                     brewlog.log('updating settings failed: ' + err);
                     callback('updating settings failed: ' + err, null);
                  } else {

                     brewdate.setBierBotDate(updatedSettings.manualTime);
                     brewdate.setUsingSystemDate(!updatedSettings.manualSetTime);
                     routeSettings.passwordDisabled = !updatedSettings.passwordActivated;
                     brewlog.log('passwordDisabled = ' + routeSettings.passwordDisabled);

                     motorWarningCheckedBuffer = updatedSettings.motorWarningChecked;
                     addToSensorValBuffer = updatedSettings.addToSensorVal;
                     boilingTempCBuffer = updatedSettings.boilingTempC;
                     brewlog.log("boilingTempCBuffer changed to " + boilingTempCBuffer);
                     Hardware.findById(updatedSettings.selectedHardware, function(err, hardware) {
                        if (err) {
                           brewlog.log('getting hardware failed: ' + err);
                           callback('getting hardware failed: ' + err, null);
                        } else if (hardware == null) {
                           brewlog.log('hardware with ID ' + updatedSettings.selectedHardware + ' not found.');
                           callback('hardware not found', null);
                        } else {
                           // otherwise _id is write protected
                           hardware = hardware.toObject();

                           // comment missin
                           hardware.pd.hysteresis = incoming.hardware.pd.hysteresis;

                           // get the _id since _id cannot be replaced in mongoDB
                           var id = hardware._id

                           // remove from old object
                           delete hardware._id;
                           delete hardware.__v;

                           // Do the upsert, which works like this: If no Contact document exists with
                           // _id = contact.id, then create a new doc using upsertData.
                           // Otherwise, update the existing doc with upsertData
                           brewlog.log(JSON.stringify(hardware));
                           Hardware.update({
                              _id: id
                           }, hardware, {
                              upsert: true
                           }, function(err, updatedHardware) {
                              if (err) {
                                 brewlog.log('failed to update hardware: ' + err);
                              }

                              callback(false, {
                                 settings: updatedSettings
                              });
                              brewlog.log('updating settings successfull');
                           });

                           // reset PD-Controller
                           PD.reset();
                        }
                     });
                  }
               })
            });

            socket.on('addCommentToCurrentBrew', function(comment, callback) {

               addLogToCurrentBrew(function(err, date) {
                  if (err) {
                     // failed
                     brewlog.log('adding comment failed: ' + err);
                     callback('adding comment failed' + err, null);
                  } else {
                     // succes => err = null
                     brewlog.log('added comment: ' + comment);
                     callback(null, {
                        comment: [date, comment]
                     });
                  }
               }, null, null, null, comment);
            });

            socket.on('getSettings', function(newSettings, callback) {
               Setting.findOne(function(err, appSettings) {
                  if (err) {
                     callback(err, null);
                  } else {
                     Hardware.find(function(err, hardwares) {
                        if (err) {
                           callback(err, null);
                        } else {
                           // otherwise _id is write protected
                           // as well as version and id field are protected due
                           // to mongoose schema
                           appSettings = appSettings.toObject();

                           //brewlog.log(JSON.stringify(bierBotState));

                           appSettings.version = version.getVersion();
                           appSettings.id = cpuid;
                           appSettings.updateAvailable = updateAvailable;
                           appSettings.updateAvailableVersion = updateAvailableVersion;
                           appSettings.updateInProgress = updateInProgress;

                           callback(false, {
                              settings: appSettings,
                              hardware: hardwares,
                              bierBotState: bierBotState
                           });
                           brewlog.log('settings sent.');

                        }
                     });
                  }
               });
            });

            // loads a recipe and transforms it into a brew
            // brew represents a recipe enhanced with state information and
            // logging data
            socket.on('loadRecipe', function(recipeID, callback) {
               // get the recipe from the db
               brewlog.log('load recipe called');
               getRecipe(recipeID, function(err, recipe) {
                  if (!err) { // error used already in lower leven
                     // transform found recipe into brew

                     getCurrentBrew(function(err, currentBrew) {
                        if (currentBrew) {
                           brewlog.log('current brew already existing: ' + currentBrew.name);
                           callback('current brew already existing: ' + currentBrew.name, null);
                        } else {
                           transformRecipeToBrew(recipe, function(err, brew) {

                              if (brew == null || err) {
                                 brewlog.log('transforming failed: ' + err);
                                 callback('transforming failed: ' + err, null);
                                 return;
                              }

                              // store the brew to the db
                              db.logs.save(recipe, function(err, saved) {
                                 if (err || !saved) {
                                    brewlog.log('brew not inserted, error: ' + err);
                                    callback('brew not inserted, error: ' + err, null);
                                 } else {
                                    // return brew to client
                                    PD.reset();
                                    callback(false, saved); // validate, is there a _id?
                                    brewlog.log("brew " + recipe.name + " saved");
                                    controlState.auto = true;
                                    brewlog.log('automode set');
                                 }
                              });
                           });
                        }

                     });
                  } else {
                     brewlog.log('loading recipe failed: ' + err);
                     callback('loading recipe failed: ' + err, null);
                  }
               });
            });

            // array being the values
            // mode = 'heat' or 'cool'
            var filterTemperatureLog = function(callback, array, mode) {
               Setting.findOne(function(err, appSettings) {
                  if (!err) {
                     var arrayLen = array.length;
                     brewlog.log('filtering temperature array[' + arrayLen + '] in mode ' + mode);

                     // filter
                     if ('heat' == mode) {
                        // only use last 60 minutes, one element every 10s
                        var lim = -60 / appSettings.logEveryXsTempValToDBHeat * appSettings.displayLastMinutesHeat;
                        if (array.length < (lim * -1)) {
                           lim = (-1) * array.length;
                        }
                        array = array.splice(lim, arrayLen);
                     } else if ('cool' == mode) {
                        // only use last 1 day, one element every 5min
                        var lim = -60 / appSettings.logEveryXsTempValToDBCool * appSettings.displayLastMinutesCool;
                        brewlog.log('lim=' + lim);
                        if (array.length < (lim * -1)) {
                           lim = (-1) * array.length;
                        }
                        array = array.splice(lim, arrayLen);
                     }

                     brewlog.log('returning ' + array.length + ' elemtent(s)');
                     callback(null, array);
                  }
               });
            };

            // gets the current brew
            socket.on('getCurrentBrew', function(data, callback) {
               brewlog.log('getCurrentBrew called.');
               getCurrentBrew(function(err, currentBrewLocal) {
                  if (!err) { // err has already been logged

                     filterTemperatureLog(function(err, array) {
                        if (!err) {
                           currentBrewLocal.logs.temperature = array;

                           callback(false, currentBrewLocal);
                           brewlog.log('currentBrew returned');
                        }
                     }, currentBrewLocal.logs.temperature, currentBrewLocal.mode);
                  } else {
                     callback(err, null);
                     brewlog.log('no currentBrew found, err: ' + err);
                  }
               });
            });

            socket.on('startRecipe', function(data, callback) {
               getCurrentBrew(function(err, currentBrew) {

                  if (currentBrew.steps.length == 0) {
                     var errMsg = 'failed starting recipe, no steps.';
                     brewlog.log(errMsg);
                     callback(errMsg, null);
                     finishAutoMode(function(err, cB) {
                        if (!err) {
                           //addLogToCurrentBrew(function(err){},null,null,-2,null);	// temp,stirr,step
                           callback(false, {
                              number: -2,
                              step: null
                           });
                        } else {
                           callback(err, null);
                        }
                     });
                     return;
                  }

                  var firstStepIdx = 0;
                  currentBrew.currentStep = firstStepIdx;
                  brewlog.log('now:' + brewdate.gcd() + ', offsetted (GMT0): ' + getNowDate());
                  currentBrew.steps[firstStepIdx].started = getNowDate();
                  currentBrew.started = getNowDate();
                  currentBrew.sudSizeLitres = data.sudSizeLitres;

                  brewlog.log('sudSizeLitres: ' + data.sudSizeLitres);
                  safeModeActive = false;

                  updateCurrentBrew(currentBrew, function(err) {
                     if (!err) { // err has already been logged
                        callback(false, currentBrew);
                        socket.broadcast.emit('brewChanged', currentBrew);
                        brewlog.log('brew ' + currentBrew.name + ' started');
                        beepShortLong();
                     } else {
                        callback(err, null);
                     }
                  });
               });
            });

            socket.on('stopAuto', function(data, callback) {
               finishAutoMode(function(err, currentBrew) {
                  if (!err) { // err has already been logged
                     callback(false, currentBrew._id);
                  } else {
                     callback(err, null);
                  }
               });
            });

            // gets the current brew
            socket.on('setNextStep', function(data, callback) {
               setNextStep(function(err, data) {
                  if (!err) {
                     callback(false, data);
                  } else {
                     callback(err, null);
                  }
               });
            });

            // gets the mode
            socket.on('getMode', function(data, callback) {
               var mode = 'manual';

               if (controlState.auto)
                  mode = 'auto';

               callback(false, mode);
            });


            // updates or inserts a recipe in(to) the database
            // inserting will take place if _id is zero
            socket.on('upsertRecipe', function(recipe, callback) {
               brewlog.log('upsertRecipe called.');

               if (recipe._id == null) {
                  // recipe is a new recipe => save new recipe
                  common.addRecipe(recipe, callback);
               } else {
                  // recipe is a old recipe, needs to be updated
                  // get the _id since _id cannot be replaced in mongoDB
                  var stringID = recipe._id;
                  var id = db.ObjectId(recipe._id)

                  // remove from old object
                  delete recipe._id;


                  db.recipes.update({
                     _id: id
                  }, recipe, function(err, statusInfo) {
                     if (err) {
                        brewlog.log('recipe not updated: ' + err);
                        callback('recipe not saved, error: ' + err, null);
                     } else {
                        getRecipe(stringID, function(err, recipe) {
                           if (err) {
                              callback('getting recipe failed ' + err, null);
                              brewlog.log('getting recipe failed ' + err, null);
                           } else {
                              callback(false, recipe);
                              brewlog.log('recipe (' + recipe.name + ', ' + recipe._id + ') updated');
                           }
                        })

                        // db.recipes.find({_id: db.ObjectId(recipe._id)}, function(err, recipes) {
                        // 	if( err || !recipes) brewlog.log("No mathing recipe with id ' + id + ' found");
                        // 	else recipes.forEach( function(foundRecipe) {
                        // 		brewlog.log('new recipe: ' + foundRecipe.steps.length);
                        // 	});
                        // });
                     }
                  });
               }
            });

            socket.on('enterSafeState', function(data, callback) {
               enterSafeState();
               callback(false, true);
            });

            socket.on('controlRequest', function(controlRequest, callback) {
               var success = false;
               if (controlRequest.targetTemperature != null) {
                  // set target temparature
                  // set potential restrictions here!
                  controlState.targetTemperature = controlRequest.targetTemperature;
                  forceControl = true; // forces the control to take action once
                  success = true;
                  brewlog.log('   targetTemperature = ' + controlRequest.targetTemperature + ' ... SET');
                  safeModeActive = false;
               }
               if (controlRequest.stirr != null) {
                  // set stirr
                  // set potential restrictions here!
                  controlState.stirr = controlRequest.stirr;
                  success = true;
                  brewlog.log('   stirr = ' + controlRequest.stirr + ' ... SET');
                  safeModeActive = false;
               }
               if (controlRequest.mode != null) {
                  // set mode
                  // set potential restrictions here!
                  controlState.mode = controlRequest.mode;
                  success = true;
                  brewlog.log('   mode = ' + controlRequest.mode + ' ... SET');
                  safeModeActive = false;
               }

               brewlog.log('controlRequest, success = ' + success + '. stirr = ' + controlState.stirr);
               callback(!success, {
                  controlState: controlState
               });
            });

            socket.on('getWifiList', function(controlRequest, callback) {
               scanForWifiNetworks(function(err) {
                  if (err) {
                     callback(err, null);
                  } else {
                     brewlog.log("getting WiFi list sucessfull");
                     if (typeof bierBotState.networks != 'undefined' && bierBotState.networks.length > 0) {
                        callback(null, {
                           networks: bierBotState.networks
                        });
                     } else {
                        callback(null, {
                           networks: false
                        });
                     }
                  }
               })
            });


            socket.on('getWifiSignalStrength', function(unsued, callback) {

               callback(null, bierBotState.wifiSignalStrength);
            });

            socket.on('submitFeedback', function(feedback, callback) {

               // TODO: currently not supported on OSS version
            });

            socket.on('deleteRecipe', function(recipe) {
               // check if recipe exists
               brewlog.log('deleting recipe \"' + recipe.name + '\" (id = ' + recipe._id + ') ...');
               db.recipes.remove({
                  _id: db.ObjectId(recipe._id)
               }, function(err, updated) {
                  if (err || !updated) brewlog.log("recipe not deleted:" + err);
                  else brewlog.log("recipe deleted");
               });
            });

            socket.on('deleteHardware', function(hardware, callback) {
               // check if recipe exists
               brewlog.log('deleting hardware \"' + hardware.name + '\" (id = ' + hardware._id + ') ...');

               Hardware.count({}, function(err, cnt) {
                  if (err) {
                     brewlog.log("Failed getting hardware count: " + err);
                     callback("Failed getting hardware count: ");
                     return;
                  }

                  if (cnt <= 1) {
                     brewlog.log("only one hardware left. aborting...");
                     callback("cannot delete last hardware");
                  } else {
                     brewlog.log("found " + cnt + " hardware(s). continueing...");

                     Setting.findOne(function(err, appSettings) {
                        if (err) {
                           brewlog.log('deleting hardware failed: ' + err);
                           callback(err);
                        } else {
                           Hardware.findByIdAndRemove(hardware._id, function(err) {
                              if (err) {
                                 brewlog.log("hardware not deleted:" + err);
                                 callback(err);
                              } else {
                                 brewlog.log("hardware deleted!");
                                 Hardware.findOne(function(err, hw) {

                                    if (err) {
                                       callback(err);
                                       brewlog.log('failed getting new hardware:' + err);
                                    } else {
                                       appSettings.selectedHardware = hw._id;

                                       common.updateAppSettings(appSettings, function(err, updatedSettings) {
                                          if (err) {
                                             brewlog.log('failed updating app settings:' + err);
                                             callback(err);
                                          } else {
                                             brewlog.log('selected new hardware: ' + hw.name);
                                             callback(null, hw._id);
                                          }
                                       });
                                    }
                                 });
                              }
                           });
                        }
                     });
                  }
               });
            });

            socket.on('upsertHardware', function(hardware, callback) {
               common.upsertHardware(hardware, function(err, upsertedHardware) {
                  if (err) {
                     brewlog.log('failed to upsert hardware: ' + err);
                     callback(err, null);
                  } else {
                     brewlog.log('added hardware: ' + util.inspect(upsertedHardware, false, null));
                     // load new values
                     PD.reset();
                     callback(null, upsertedHardware);
                  }
               })
            });

            socket.on('getControlState', function(data, callback) {
               brewlog.log('getting control state ...');
               callback(null, controlState);
            });

            socket.on('deleteLog', function(id, callback) {
               // check if recipe exists
               brewlog.log('deleting log (' + id + ') ...');
               db.logs.remove({
                  _id: db.ObjectId(id)
               }, function(err, updated) {
                  if (err || !updated) {
                     brewlog.log("log not deleted:" + err);
                     callback("log not deleted:" + err);
                  } else {
                     callback(false);
                     brewlog.log("log deleted");
                  }
               });
            });
         } else {
            brewlog.log('socket access denied, session (' + util.inspect(session, false, null) + ')');
         }
      } else {
         brewlog.log('getting sessionStore failed: ' + err);
      }
   });
});

// leftAttempts is decreased every time
var searchTemperatureSensors = function(leftAttempts) {
   if (leftAttempts > 0) {
      sensor.list(function(err, listOfDeviceIds) {
         if (err) {
            brewlog.log('error getting temperature sensors: ' + err);
         } else {
            if (listOfDeviceIds.length > 0 && listOfDeviceIds[0] === 'not found.') {
               brewlog.log('error getting temperature sensors: ' + listOfDeviceIds[0]);

               setTimeout(function() {
                  searchTemperatureSensors(leftAttempts - 1);
               }, 1000);
            } else {
               brewlog.log('detected ' + listOfDeviceIds.length + ' temperature sensor(s):');
               listOfDeviceIds.forEach(function(elem, idx, array) {
                  brewlog.log('   ' + idx + ': ' + elem);

                  if (idx == (listOfDeviceIds.length - 1)) {
                     // take last element from list

                     if (elem.startsWith("00-")) {
                        brewlog.log('sensor starts with 00-, not a valid sensor.');
                        setTimeout(function() {
                           searchTemperatureSensors(leftAttempts - 1);
                        }, 1000);
                     } else {
                        firstSensorID = elem;
                        brewlog.log('firstSensorID set to \"' + firstSensorID + '\" (attempts left=' + (leftAttempts - 1) + ")");

                        // read couple of times to init sensor complitely
                        var readNum = 3;
                        while (readNum > 0) {
                           readTemperature();
                           readNum = readNum - 1;
                        }
                     }
                  }
               });
            }
         }
      });
   } else {
      brewlog.log("no attempts left.");
   }
}

var initTemperatureSensor = function() {
   var attempts = 10;
   brewlog.log('initializing temperature sensors (attempts=' + attempts + ')');

   searchTemperatureSensors(attempts);
};

brewlog.log('setting driver loaded callback');
sensor.isDriverLoaded(function(err, isLoaded) {
   brewlog.log('w1 bus driver loaded: ' + isLoaded);

   if (isLoaded == false) {
      brewlog.log('loading driver ...')
      sensor.loadDriver(function(err) {
         if (err) brewlog.log('something went wrong loading the driver:', err)
         else {
            brewlog.log('driver successfully loaded');
            initTemperatureSensor();
         }
      });
   } else {
      // search for temp sensor directly
      initTemperatureSensor();
   }
});

// interrupt when temp sensor is connected
// when no temp sensor is inserted, voltage is 3,3, when the
// temp sensor is inserted, voltage drops to GND
// has to be delayed at system startup
// var bindToISRIntervalID = setInterval(function() {
// 	brewlog.log('setting up temperature sensor ISR...');
// 	try {

// 		if (bindToISRIntervalID != null) {
// 			clearInterval(bindToISRIntervalID);
// 		}
// 		brewlog.log("ISR for temp sensor detection... SET");
// 	}
// 	catch(err) {
// 		brewlog.log("ISR for temp sensor detection... FAILED (" + err + ")");
// 	}
// }, 5000);


var gettingTempSensorErrorShown = false;
var fakeTempCountMax = 10;
var fakeTempCount = fakeTempCountMax;
var glowTime = 120; // determines (in seconds) how long (after heating has been turned off) the temperature stop rissing
var glow = 0;
var logEveryXTempValToDBCounter = 999999999; // long instantly
var readTemperature = function() {
   if (debugMode) {

      var tempSim = 0;

      if (!firstTempCelsius) {
         firstTempCelsius = 19.8;
      }

      if (controlState.mode == 'cool') {

         if (glow > 0) {
            glow = glow - 1;
         }
         if (fakeTempCount == fakeTempCountMax) {
            brewlog.log('heatingstate=' + heatingState + ', glow=' + glow);
            if (heatingState === 1) {
               glow = glowTime;
               tempSim = -0.05;
            } else if (glow > 0) {
               tempSim = -0.05;
            } else if (heatingState === 0) {
               if (firstTempCelsius < 10) {
                  tempSim = 0.01;
               } else {
                  tempSim = -0.01;
               }
            }

            fakeTempCount = 0;
         } else {
            fakeTempCount = fakeTempCount + 1;
         }
      } else if (controlState.mode == 'heat') {

         if (glow > 0) {
            glow = glow - 1;
         }
         if (fakeTempCount == fakeTempCountMax) {
            brewlog.log('heatingstate=' + heatingState + ', glow=' + glow);
            if (heatingState === 1) {
               glow = glowTime;
               tempSim = 0.1;
            } else if (glow > 0) {
               tempSim = 0.15;
            } else if (heatingState === 0) {
               tempSim = -0.08;
            }

            fakeTempCount = 0;
         } else {
            fakeTempCount = fakeTempCount + 1;
         }

      }

      firstTempCelsius = firstTempCelsius + tempSim;
      firstTempCelsius = Math.round(firstTempCelsius * 10) / 10;
      //brewlog.log('fake temp:' + firstTempCelsius);

      // logging stuff
      getCurrentBrew(function(err, currentBrew) {
         if (!err) {
            Setting.findOne(function(err, appSettings) {

               if (!err) {
                  var logEveryXsTempValToDB = 0;
                  if (currentBrew.mode == 'heat') {
                     logEveryXsTempValToDB = appSettings.logEveryXsTempValToDBHeat;
                  } else if (currentBrew.mode == 'cool') {
                     logEveryXsTempValToDB = appSettings.logEveryXsTempValToDBCool;
                  }

                  //brewlog.log('dbCounter: ' + logEveryXTempValToDBCounter + ', logEveryXsTempValToDB: ' + logEveryXsTempValToDB);

                  // count values
                  if (logEveryXTempValToDBCounter >= logEveryXsTempValToDB) {
                     logEveryXTempValToDBCounter = 0;
                     addLogToCurrentBrew(function(err) {}, firstTempCelsius, null, null, null); // temp,stirr,step
                  }

                  logEveryXTempValToDBCounter = logEveryXTempValToDBCounter + 1;
               }
            });
         }
      });

   } else if (firstSensorID != null) {
      // no debug mode
      displayNoSensorWarn = true;
      sensor.get(firstSensorID, function(err, temp) {
         if (err) {
            if (gettingTempSensorErrorShown == false) {
               brewlog.log('getting temperature failed: ' + err);
               gettingTempSensorErrorShown = true;
            }
         } else {
            if (plausible.temp(temp) == true) {
               firstTempCelsius = temp + addToSensorValBuffer;

               // logging stuff
               getCurrentBrew(function(err, currentBrew) {
                  if (!err) {
                     Setting.findOne(function(err, appSettings) {

                        if (!err) {
                           var logEveryXsTempValToDB = 0;
                           if (currentBrew.mode == 'heat') {
                              logEveryXsTempValToDB = appSettings.logEveryXsTempValToDBHeat;
                           } else if (currentBrew.mode == 'cool') {
                              logEveryXsTempValToDB = appSettings.logEveryXsTempValToDBCool;
                           }
                           //brewlog.log('dbCounter: ' + logEveryXTempValToDBCounter + ', logEveryXsTempValToDB: ' + logEveryXsTempValToDB);

                           // count values

                           if (logEveryXTempValToDBCounter >= logEveryXsTempValToDB) {
                              logEveryXTempValToDBCounter = 0;
                              addLogToCurrentBrew(function(err) {}, temp, null, null, null); // temp,stirr,step
                           }

                           logEveryXTempValToDBCounter = logEveryXTempValToDBCounter + 1;
                        }
                     });
                  }
               });
            } else if (temp == false) {
               firstTempCelsius = temp; // no temp displayed in GUI
            }
         }
      });
   } else {
      if (displayNoSensorWarn == true) {
         displayNoSensorWarn = false;
         brewlog.log("no sensor connected.");
      }
   }
};
// start getting temperature
var temperatureIntervalID = setInterval(function() {
   // sensor.getAll(function (err, tempObj) {
   // 			    brewlog.log(tempObj);
   // 			});
   readTemperature();
}, MAIN_INTERVAL_TIME); //1s intervall time
var displayNoSensorWarn = true;

var enterSafeState = function() {
   brewlog.log('enterering safe state ...');
   controlState.stirr = false;
   controlState.targetTemperature = 0;
   forceControl = true; // forces the control to take action once
   setMotor(0);
   setHeatingCooling(0);
   safeModeActive = true;
}


var finishAutoMode = function(callback) {
   brewlog.log('finishing auto mode...')
   getCurrentBrew(function(err, currentBrew) {
      if (err) {
         callback(err, null);
      } else {
         brewlog.log('current brew retrieved ...');

         currentBrew.currentBrew = false; // this brew is no longer being brewed
         currentBrew.finished = getNowDate();
         currentBrew.currentStep = -2; // finished, whereas -1 = not yet started
         var diff = new Date(currentBrew.finished) - new Date(currentBrew.started);
         var brewedMinutes = (1.0 * diff / 1000) / 60;
         brewlog.log('brewedMinutes is ' + brewedMinutes);

         updateCurrentBrew(currentBrew, function(err) {
            if (err) {
               callback(err, null);
            } else {
               brewlog.log("updating curent brew in database...");
               updateCurrentBrewInDatabase(true, true);
               callback(false, currentBrew);

               // save state
               setMotor(0);
               setHeatingCooling(0);

               controlState.auto = false;
               brewlog.log('brew \"' + currentBrew.name + '\" stopped after ' + brewedMinutes + 'min.');
               io.sockets.emit('automodeStopped', currentBrew._id);
               enterSafeState();
               beepMorseBeer();
               telegram.sendMessage('Your brew is done. Get to work!');
            }

         }, false);
      }
   });
};

var emptyCurrentBrewBuffer = function() {
   brewlog.log('clearing current brew buffer');
   currentBrewBuffered = null;
}

var updateCurrentBrewInDatabase = function(clearBuffer, inspect) {
   // some basic checks, in order to determine if the cyclic
   // writing to the db is necessary

   getCurrentBrewFromDatabase(function(err, currentBrew) {
      if (!err && currentBrew) {
         brewlog.log("retrieved current brew from database: err=" + err + ", currentBrew=" + currentBrew + ", currentBrewBuffered=" + currentBrewBuffered);
         brewlog.log("temperature log length is " + currentBrew.logs.temperature.length);

         if (currentBrewBuffered) {
            brewlog.log("buffereed temperature log length is " + currentBrewBuffered.logs.temperature.length);
            var id1 = db.ObjectId(currentBrew._id);
            var id2 = db.ObjectId(currentBrewBuffered._id);

            if (inspect) {
               brewlog.log('currentBrewDatabase.currentbrew = ' + currentBrew.currentBrew + ", currentBrewBuffer.currentBrew = " + currentBrewBuffered.currentBrew);
            }

            if (id1.equals(id2)) {
               // get the _id since _id cannot be replaced in mongoDB
               var id = db.ObjectId(currentBrewBuffered._id)
               var idBackup = currentBrewBuffered._id;

               // remove from old object
               delete currentBrewBuffered._id;

               // update all settings objects
               brewlog.log("updating current brew in database...");
               db.logs.update({
                  _id: id
               }, currentBrewBuffered, function(err, updated) {
                  if (err || !updated) {
                     brewlog.log('failed to update current brew: ' + err);
                  } else {
                     if (currentBrewBuffered != null) {
                        currentBrewBuffered._id = idBackup;
                     }

                     brewlog.log("current brew updated, new state is: " + currentBrewBuffered.currentBrew);
                     if (clearBuffer) {
                        brewlog.log("buffereed temperature log length at pos 2 is " + currentBrewBuffered.logs.temperature.length);
                        emptyCurrentBrewBuffer();
                     }
                  }
               });
            } else {
               var str = 'cannot update current brew if IDs dont match. old: \"' + currentBrew._id + '\", new: \"' + currentBrewBuffered._id + '\".';
               brewlog.log(str);
               return;
            }
         } else {
            var str = 'currentBrewBuffered is null.';
            brewlog.log(str);
            return;
         }
      }
   });

}

// start getting temperature
var updateCurentBrewInDatabaseIntervalID = setInterval(function() {
   updateCurrentBrewInDatabase();
}, 120000); // every 120s = 2 minutes

var currentBrewBuffered = null;

var updateCurrentBrew = function(newCurrentBrew, callback, inspect) {
   // brewlog.log('updateCurrentBrew: oldlen: ' + currentBrewBuffered.logs.temperature.length + ', newlen: ' +
   // 	newCurrentBrew.logs.temperature.length);
   currentBrewBuffered = newCurrentBrew;
   if (inspect) {
      brewlog.log(util.inspect(currentBrewBuffered, false, null));
   }
   callback(null); // no error
}

var getCurrentBrewFromDatabase = function(callback) {
   db.logs.find({
      currentBrew: true
   }, function(err, currentBrews) {

      if (err || currentBrews.length == 0) {
         //brewlog.log("No current brew found");
         callback(null, null);
      } else currentBrews.forEach(function(brew) {
         if (currentBrews.length > 1) {
            brewlog.log('More than one (' + currentBrews.length + ') current brews found. Your database might be corrupted.');
            callback('database corrupted, ' + currentBrews.length + ' current brews', null);
         } else {
            brewlog.log('currentBrew from database retrieved');
            callback(false, brew);
         }
      });
   });
};

var getCurrentBrew = function(callback) {
   if (currentBrewBuffered && currentBrewBuffered.currentBrew === true) {
      // must copy object since object are call-by-reference
      var currentBrewBufferedCopy = JSON.parse(JSON.stringify(currentBrewBuffered));

      callback(null, currentBrewBufferedCopy);
   } else {
      //brewlog.log('no currentBrew buffered, retrieving from db ...');
      getCurrentBrewFromDatabase(function(err, currentBrewDB) {
         if (err) {
            callback('error getting current brew: ' + err, null);
         } else if (currentBrewDB == null) {
            callback('there is no current brew', null);
         } else {
            currentBrewBuffered = currentBrewDB;
            callback(null, currentBrewDB);
         }
      })
   }
};

var getRecipe = function(id, callback) {

   db.recipes.find({
      _id: db.ObjectId(id)
   }, function(err, recipes) {
      if (err || !recipes) {
         brewlog.log("No mathing recipe with id ' + id + ' found");
         callback("No mathing recipe with id ' + id + ' found", null);
      } else recipes.forEach(function(recipe) {
         //brewlog.log(util.inspect(recipe, false, null));
         callback(false, recipe);
      });
   });
};

var getLog = function(id, callback) {

   db.logs.find({
      _id: db.ObjectId(id)
   }, function(err, logs) {
      if (err || !logs) brewlog.log("No mathing log with id ' + id + ' found");
      else logs.forEach(function(log) {
         callback(false, log);
      });
   });
};

// will log the corresponding item. if itm is null, this item will not be logged
// callback(err)
var addLogToCurrentBrew = function(callback, temp, stirr, step, comment, heating) {
   if (controlState.auto == false) {
      callback('logging failed, only supported in auto mode');
      return; // only log in auto mode
   }
   getCurrentBrew(function(err, currentBrew) {
      if (err) {

         callback('logging failed :' + err);
         brewlog.log('logging failed. ' + err);
      } else {
         if (currentBrew.currentStep >= 0) { // only log if started
            var updateNecessary = false;
            var logDate = getNowDate();
            if (temp != null) {
               currentBrew.logs.temperature.push([logDate, temp]);
               updateNecessary = true;
            }
            if (stirr != null) {
               currentBrew.logs.stirr.push([logDate, stirr]);
               updateNecessary = true;
            }
            if (step != null) {
               currentBrew.logs.step.push([logDate, step]);
               updateNecessary = true;
            }
            if (comment != null) {
               currentBrew.logs.comments.push([logDate, comment]);
               updateNecessary = true;
            }
            if (heating != null) {
               currentBrew.logs.heating.push([logDate, heating]);
               updateNecessary = true;
            }

            if (updateNecessary == true) {
               updateCurrentBrew(currentBrew, function(err) {
                  if (err) {
                     callback('logging failed (updating current brew). ' + err);
                     brewlog.log('logging failed (updating current brew). ' + err);
                  } else {
                     callback(null, logDate);
                  }
               });
            }
         } else {
            callback('logging failed, recipe not started yet.');
         }
      }
   });
};

var transformRecipeToBrew = function(recipe, callback) {

   Setting.findOne(function(err, appSettings) {
      brewlog.log('appsettings: ' + util.inspect(appSettings, false, null));
      if (err) {
         brewlog.log('transforming recipe failed: ' + err);
         callback('transforming recipe failed: ' + err, null);
      } else {
         var brew = recipe;

         brew.currentBrew = true; // this brew is currently being brewed (true) and no historic brew (false)
         brew.currentStep = -1; // indicates a invalid current step for the beginning
         // is set to 1 in startRecipe

         if (brew.mode == 'heat') {

            brew.sudNumber = appSettings.sudNumber;
            appSettings.sudNumber = appSettings.sudNumber + 1;

            common.updateAppSettings(appSettings, function(err, updatedSettings) {
               if (err) {
                  brewlog.log('new sudnumber not stored, error: ' + err);
               }
            })
         }

         brew.basedOn = brew._id;
         brew._id = null;
         brew.loaded = getNowDate();
         brew.started = null;
         brew.finished = null;
         brew.sudSizeLitres = 25;

         brew.logs = {
            temperature: [], // format [brewdate.gcd(), temp°C ]
            stirr: [], // format [brewdate.gcd(), stirr(true,false)]
            step: [], // format [brewdate.gcd(), stepNum(0indexed)]
            comments: [], // format [brewdate.gcd(), comment(0indexed)]
            heating: [], // format [brewdate.gcd(), comment(0indexed)]
         };

         callback(false, brew);
      }
   });
};



var setNextStep = function(callback) {
   getCurrentBrew(function(err, currentBrew) {

      stepnum = currentBrew.currentStep + 1;

      if (stepnum < currentBrew.steps.length) {
         currentBrew.currentStep = stepnum;
         currentBrew.steps[stepnum].started = getNowDate();

         updateCurrentBrew(currentBrew, function(err) {
            if (!err) { // err has already been logged
               callback(false, {
                  number: stepnum,
                  step: currentBrew.steps[stepnum]
               });


               io.sockets.emit('newStepSet', {
                  number: stepnum,
                  step: currentBrew.steps[stepnum]
               });
               brewlog.log('new step broadcasted.');

               brewlog.log('next step (' + stepnum + ') set');
               addLogToCurrentBrew(function(err) {}, null, null, stepnum, null); // temp,stirr,step
               beepShortLong();

               safeModeActive = false;
            } else {
               callback(err, null);
            }
         });
      } else {
         finishAutoMode(function(err, cB) {
            if (!err) {
               //addLogToCurrentBrew(function(err){},null,null,-2,null);	// temp,stirr,step
               callback(false, {
                  number: -2,
                  step: null
               });
            } else {
               callback(err, null);
            }
         });
      }
   });
};

var tempReachedTolerance = 0.8; // celsius
var boilingTempCBuffer = 97;
// this function automatically starts a new step
var autoModeIntervalID = setInterval(function() {
   if (controlState.auto === true) {
      getCurrentBrew(function(err, currentBrew) {
         if (!err) {
            var stepnum = currentBrew.currentStep;
            controlState.auto = true;

            if (stepnum > -1) {
               var currentStep = currentBrew.steps[stepnum];
               var nextStepDue = false;

               // set tempReached in every case, although it is only necessary
               // if step is ended by time
               // if the temperature matches the set temperature
               // and hold date is not set yet, set hold date
               if (!currentStep.tempReached) {
                  //brewlog.log("temp not reached");
                  //brewlog.log("controlState.mode=" + controlState.mode);
                  //brewlog.log("currentStep.targetTemperatur=" + currentStep.targetTemperature);
                  //brewlog.log("tempReachedTolerance=" + tempReachedTolerance);
                  //brewlog.log("firstTempCelsius=" + firstTempCelsius);
                  //brewlog.log("boilingTempCBuffer=" + boilingTempCBuffer);
                  // temperatures higher than 95C are regarded "cookig"
                  if (
                     (controlState.mode == 'heat' &&
                        (firstTempCelsius >= (currentStep.targetTemperature - tempReachedTolerance)) ||
                        (firstTempCelsius >= boilingTempCBuffer)
                     ) ||
                     (controlState.mode == 'cool' &&
                        (firstTempCelsius >= (currentStep.targetTemperature - tempReachedTolerance)) &&
                        (firstTempCelsius <= (currentStep.targetTemperature + tempReachedTolerance))
                     )
                  ) {

                     if (firstTempCelsius == 85) {
                        brewlog.log('sensor error while settings temperature reached ... skipping.');
                     } else {
                        brewlog.log('tempReached is not set (' + currentStep.tempReached + ') ... setting');
                        brewlog.log('targettemp reached, setting holddate');
                        currentStep.tempReached = getNowDate()

                        updateCurrentBrew(currentBrew, function(err) {

                           io.sockets.emit('tempReached', {
                              number: stepnum,
                              step: currentStep,
                              date: currentStep.tempReached
                           });
                        });
                     }
                  }
               }

               // // determine if next step is due
               if (currentStep.endStepBy == 'time') {

                  // if holdDate is set, check if time is over
                  if (currentStep.tempReached) {
                     var tempReached = new Date(currentStep.tempReached);
                     var tempReachedMS = tempReached.getTime(); // add offset to startDate
                     tempReached = new Date(tempReachedMS);

                     var end = tempReached.getTime() + currentStep.timeLimit * 60 * 1000; // minutes to ms
                     var endDate = new Date(end);
                     var endDate = new Date(endDate.getTime()); // add offset to endDate
                     var diffInMs = endDate.getTime() - getNowDate();

                     if (diffInMs <= 0) {

                        brewlog.log('timelimit of step reached (' + currentStep.timeLimit + 'min) - setting next step');

                        nextStepDue = true;
                     }
                  }
               }

               if (nextStepDue == true) {
                  setNextStep(function(err, data) {
                     if (!err) {
                        // done in upper layer
                     } else {
                        // done in upper layer
                     }
                  });
               }

               // setting the control state
               if (controlState.targetTemperature == null) {
                  controlState.targetTemperature = currentStep.targetTemperature;
                  forceControl = true; // forces the control to take action once
               }
               if (controlState.targetTemperature != currentStep.targetTemperature) {
                  brewlog.log('requesting new target  target temperature : ' + currentStep.targetTemperature + "°C (old value: " + controlState.targetTemperature + ")");
                  controlState.targetTemperature = currentStep.targetTemperature;
                  forceControl = true; // forces the control to take action once
               }

               //brewlog.log('controlState.stirr=' + util.inspect(controlState.stirr, false, null));
               //brewlog.log('currentstep.stirr=' + util.inspect(currentStep.stirr, false, null));

               //if (controlState.stirr != (currentStep.stirr == 'true')) {
               //	brewlog.log('requesting new target  stirr (txt) : ' + currentStep.stirr + " (old value: " + controlState.stirr + ")");
               //	controlState.stirr = (currentStep.stirr == 'true');
               //}
               if (controlState.stirr != currentStep.stirr) {
                  brewlog.log('requesting new target  stirr (bool) : ' + currentStep.stirr + " (old value: " + controlState.stirr + ")");
                  controlState.stirr = currentStep.stirr;
               }
               if (controlState.mode != currentBrew.mode) {
                  brewlog.log('requesting new target mode : ' + currentBrew.mode + " (old value: " + controlState.mode + ")");
                  controlState.mode = currentBrew.mode;
               }
            }
         }
      });
   }
}, MAIN_INTERVAL_TIME);


// control loop, simply does, what the controlState says
var controlIntervalID = setInterval(function() {
   // brewlog.log((controlState.stirr));
   // brewlog.log((controlState.stirr == true) + ' && ' + (controlState.mode == 'heat'));
   // brewlog.log('result: ' + ((controlState.stirr == true) && (controlState.mode == 'heat')));
   //brewlog.log('type is: ' + typeof controlState.stirr);

   // turn on/off motor, on is only possible in heating mode
   //brewlog.log('controlState.stirr' + util.inspect(controlState.stirr, false, null));

   //brewlog.log('controlState.stirr=' + util.inspect(controlState.stirr, false, null));
   //brewlog.log('controlState.stirr == true' + util.inspect((controlState.stirr == true), false, null));
   //brewlog.log('controlState.mode=' + util.inspect(controlState.mode, false, null));

   if ((controlState.stirr == true) && (controlState.mode == 'heat')) {
      //brewlog.log('setting motor ..');
      Setting.findOne(function(err, appSettings) {
         if (err) {
            brewlog.log('setting motor failed, due to settings error: ' + err);
         } else {
            //brewlog.log('setting motor ..');
            setMotor(appSettings.voltsMotorCalibValue);
         }
      });
   } else {
      setMotor(0);
   }

   // temperature
   PD.cyclic(controlState, firstTempCelsius, forceControl);
   forceControl = false;

}, MAIN_INTERVAL_TIME);

var getNowDate = function() {
   var now = brewdate.gcd();
   return new Date(now.getTime() + now.getTimezoneOffset());
}

// init
// get currentBrew once in order to set auto mode
getCurrentBrewFromDatabase(function(err, currentBrew) {
   if (!err) {
      if (currentBrew) {
         controlState.auto = true;
      } else {
         controlState.auto = false;
      }
      brewlog.log('setting initial auto=' + controlState.auto);
   } else {
      brewlog.log('error setting initial mode: ' + err);
      controlState.auto = false;
   }
});

var cookingTempBuffer = 0;
Setting.findOne(function(err, appSettings) {
   if (err) {
      brewlog.log('failed getting app settings: ' + err);
   } else {
      boilingTempCBuffer = appSettings.boilingTempC;
      brewlog.log("boiling temp set to " + boilingTempCBuffer + "°C.")
      Hardware.findById(appSettings.selectedHardware, function(err, hardware) {
         if (err) {
            brewlog.log('getting hardware failed: ' + err);
         } else {
            if (hardware) {
               brewlog.log('selected hardware is: ' + hardware.name);
            } else {
               brewlog.log("no hardware selected.")
            }
         }
      });

      if (appSettings.passwordActivated) {
         brewlog.log('password protection ... enabled');
      } else {
         // start getting temperature
         routeSettings.passwordDisabled = true;

         brewlog.log('password protection ... disabled');
      }
   }
});

// set default states
setMotor(0);
heatCool(0); // set default state
