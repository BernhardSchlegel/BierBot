// Versioning
var brewlog = require('./brewlog');
var util = require('util'); // util.inspect(updatedRecipe, false, null)
var https = require('https');
var fs = require('fs');
var uidNumber = require("uid-number");
var exec = require('child_process').exec;
var mkdirp = require('mkdirp');

// settings
var version = '0.0.0'; // own version
var settingUpdateURLs = [
   "https://raw.githubusercontent.com/BernhardSchlegel/BierBot/master/server/libs/version-self.json",
];

// variables
var versionFilename = __dirname + '/version-self.json';
var cpuid = "";
var newVersionCallback = null; // newVersionCallback(rarpath)
var finalizeUpdateCallback = null;
var updatePath = null;
var rootdir = __dirname + '/../../'; // node process runs in /server - navigate one up

var exports = module.exports = {};

var setUpdateFinished = function() {
   brewlog.log('preparing version file ...');

   var versionData = {
      updateFinished: true,
      version: version
   }


   fs.writeFile(versionFilename, JSON.stringify(versionData, null, 4), function(err) {
      if (err) {
         brewlog.log(err);
      } else {
         brewlog.log("JSON saved to " + versionFilename);
         uidNumber("pi", function(err, uid, gid) {
            // gid is null because we didn't ask for a group name
            // uid === 24561 because that's my number.
            if (!err) {
               fs.chownSync(versionFilename, uid, gid);
            }
         });
      }
   });
}

// callback(err, true) in case it is
var updateIsFinalized = function(callback) {
   fs.readFile(versionFilename, function(err, data) {
      if (err) {
         brewlog.log('error reading version file: ' + err);
         callback(err);
      } else {

         var jsonData = JSON.parse(data);
         callback(null, jsonData.updateFinished);
      }
   });
}

//callback(err, "0.1.2")
var getVersionFromFile = function(callback) {
   fs.readFile(versionFilename, function(err, data) {
      if (err) {
         brewlog.log('error reading version file: ' + err);
         callback(err);
      } else {
         var jsonData = JSON.parse(data);
         callback(null, jsonData.version);
      }
   });
}

exports.init = function(owncpuid, newVersionCallbackInit, finalizeUpdateCallbackInit) {
   cpuid = owncpuid;
   newVersionCallback = newVersionCallbackInit;
   finalizeUpdateCallback = finalizeUpdateCallbackInit;

   // get own
   getVersionFromFile(function(err, versionFromFile) {
      if (!err) {
         version = versionFromFile;
         brewlog.log('auto update initialized (' + cpuid + ', ' + version + ')');

         // if its the first start with the new version
         updateIsFinalized(function(err, finished) {
            if (finished == false) {
               brewlog.log('finalizing update ...');
               if (finalizeUpdateCallback) {
                  finalizeUpdateCallback();
                  setUpdateFinished();
               }
            }
         });

         // check for new version once
         checkForNewVersion();

         // set intervall
         var checkVersionIntervalID = setInterval(function() {
            checkForNewVersion();
         }, 24 * 60 * 60 * 1000); // check once a day, carefull that check isn't called twice
      }
   });
}

exports.getVersion = function() {
   return version;
}
exports.dbg = function() {};

exports.chmod = function(callback) {
   uidNumber("pi", function(err, uid, gid) {
      // gid is null because we didn't ask for a group name
      // uid === 24561 because that's my number.
      if (!err) {
         brewlog.log('user id of \"pi\" is ' + uid + ', groupid is ' + gid);


         // make all files in /home/BierBot/brew/sys executable
         // sth like "sudo chmod -R u+x /home/pi/BierBot/sys"
         var chmodSysCommand = 'sudo chmod -R u+x ' + ' ' + rootdir + 'sys/';
         brewlog.log("chmodding sys using \"" + chmodSysCommand + "\"");
         var chownProcess = exec(chmodSysCommand);
         chownProcess.stdout.on('data', function(data) {
            brewlog.log('stdout: ' + data);
         });
         chownProcess.stderr.on('data', function(data) {
            brewlog.log('error chwoning sys: ' + data);
         });
         chownProcess.on('close', function(code, signal) {

            // change owner to pi
            // sth like "sudo chown -R 1000:0 /home/pi/BierBot"
            var chownCommand = 'sudo chown -R ' + uid + ':' + gid + ' ' + rootdir + '';
            brewlog.log("chowning using \"" + chownCommand + "\"");
            var chownProcess = exec(chownCommand);
            chownProcess.stdout.on('data', function(data) {
               brewlog.log('stdout: ' + data);
            });
            chownProcess.stderr.on('data', function(data) {
               brewlog.log('error chwoning: ' + data);
            });
            chownProcess.on('close', function(code, signal) {

               // grant write permission to pi
               // sth like "sudo chmod -R u+w /home/pi/BierBot/"
               var chmodCommand = 'sudo chmod -R u+w ' + rootdir + '';
               brewlog.log("chmodding using \"" + chmodCommand + "\"");
               var chownProcess = exec(chmodCommand);
               chownProcess.stdout.on('data', function(data) {
                  brewlog.log('stdout: ' + data);
               });
               chownProcess.stderr.on('data', function(data) {
                  brewlog.log('error chmodding: ' + data);
               });
               chownProcess.on('close', function(code, signal) {

                  if (callback != null) {
                     callback();
                  }
               });
            });
         });
      } else {
         installing = false;
         callback('update failed: ' + err);
      }
   });

}

// callback(err)
var installing = false;
exports.installUpdate = function(updatePath, callback) {
   if (installing == false) {
      installing = true;
      if (updatePath) {
         brewlog.log('installing update...');

         // overwrite all existing
         var targetFolder = __dirname + '/../../../BierBotUpdate';
         brewlog.log('unzipping ' + updatePath + ' to ' + targetFolder + '...');
         var process = exec('unzip -o ' + updatePath + ' -d ' + targetFolder);
         process.stdout.on('data', function(data) {
            //brewlog.log('unzipping: ' + data);
         });
         process.stderr.on('data', function(data) {
            brewlog.log('error unzipping: ' + data);
         });
         process.on('close', function(code, signal) {
            if (code == 0) {
               brewlog.log('unzipping finished with code ' + code + '...');

               var zipOutputFolder = targetFolder + "/BierBot-master";
               brewlog.log("moving zip output folder " + zipOutputFolder);
               var moveProcess = exec('rsync -a ' + zipOutputFolder + '/ /home/pi/BierBotUpdate2/'); // TODO replace

               moveProcess.stdout.on('data', function(data) {
                  brewlog.log('mv: ' + data);
               });
               moveProcess.stderr.on('data', function(data) {
                  brewlog.log('error moving: ' + data);
               });
               moveProcess.on('close', function(code, signal) {
                  exports.chmod(function() {
                     brewlog.log('update finished!');
                     if (finalizeUpdateCallback != null) {
                        finalizeUpdateCallback();
                     }
                     installing = false;
                     callback(null);
                  });
               });
            } else {
               brewlog.log('unzipping finished with code ' + code + '...');
            }
         });
      }
   } else {
      callback('update already installing');
   }
}

function IsJsonString(str) {
   try {
      JSON.parse(str);
   } catch (e) {
      return false;
   }
   return true;
}

// callback(false) = fail, callback(true) = success
var checkURL = function(requestURL, callback) {

   brewlog.log('checking for new version ... (' + requestURL + ')');

   https.get(requestURL, function(res) {
      var body = '';

      res.on('data', function(chunk) {
         body += chunk;
      });

      res.on('end', function() {
         if (IsJsonString(body) == false) {
            brewlog.log('string no json string. returning ...');
            callback(false);
            return;
         }
         callback(true);
         var response = JSON.parse(body);
         brewlog.log('got response: ' + util.inspect(response, false, null));
         brewlog.log('own version: ' + version);

         if (firstIsHigher(extract(response.version), extract(version))) {
            var versionFromGithub = extract(response.version);
            var versionStr = versionFromGithub.major + '.' + versionFromGithub.minor + '.' + versionFromGithub.build;
            brewlog.log('new version (' + versionStr + ') available ...  ');
            var downloadURL = response.url;


            mkdirp(__dirname + '/../../update/', function(err) {

               if (err) {
                  brewlog.log("error creating update path: " + err);
               } else {
                  updateTempPath = __dirname + '/../../update/' + versionStr + '_temp' + '.zip';
                  updatePath = __dirname + '/../../update/' + versionStr + '.zip';
                  fs.exists(updatePath, function(exists) {
                     if (exists == true) {
                        brewlog.log('file (' + updatePath + ') already existing ... skipping download')
                        if (newVersionCallback) {
                           newVersionCallback(updatePath, versionStr);
                        }
                     } else {
                        brewlog.log('update not available on fs, starting download ...');
                        var file = fs.createWriteStream(updateTempPath);
                        var request = https.get(downloadURL, function(response) {
                           response.pipe(file);

                           response.on('end', function() {
                              brewlog.log('downloading update ... finished');
                              fs.renameSync(updateTempPath, updatePath);
                              if (newVersionCallback) {
                                 newVersionCallback(updatePath);
                              }
                           });
                        });
                     }
                  });
               }

            });

         }
      });
   }).on('error', function(e) {
      brewlog.log("Got error: ", e);
      callback(false);
   });
};

var checkForNewVersion = function() {
   checkURL(settingUpdateURLs[0], function(value) {
      brewlog.log("checking url " + settingUpdateURLs[0] + " failed. total fail.")
   });
};

exports.checkForNewVersion = checkForNewVersion;


// UTILS ==================================================================

// version has to be separated styled liked
// bierbottype.major.minor.build.fileending
var extract = function(string) {
   var extracted = string.split(".");

   return {
      major: parseInt(extracted[0]),
      minor: parseInt(extracted[1]),
      build: parseInt(extracted[2])
   };
};

var firstIsHigher = function(version1, version2) {
   if (version1.major < version2.major) {
      return false;
   } else if (version1.major == version2.major) {

      if (version1.minor < version2.minor) {
         return false;
      } else if (version1.minor == version2.minor) {

         if (version1.build < version2.build) {
            return false;
         } else if (version1.build == version2.build) {
            return false;
         } else {
            return true;
         }
      } else {
         return true;
      }
   } else {
      return true;
   }
}
