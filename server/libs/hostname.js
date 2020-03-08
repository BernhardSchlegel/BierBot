// hostname
var exec = require('child_process').exec;
var brewlog = require('./brewlog');
var hostile = require('hostile')


module.exports.changeHostname = function(newHostname) {
   newHostname = newHostname.replace(/[^0-9a-zA-Z]/g, "");
   var process = exec('echo ' + newHostname + ' | sudo tee /etc/hostname');

   process.stdout.on('data', function(data) {
      console.log('stdout: ' + data);
   });
   process.stderr.on('data', function(data) {
      console.log('stdout: ' + data);
   });
   process.on('close', function(code, signal) {
      brewlog.log('etc/hostname set to ' + newHostname);
   });

   hostile.set('127.0.1.1', newHostname, function(err) {
      if (err) {
         brewlog.log('setting etc/hosts/ failed: ' + err);
      } else {
         brewlog.log('set /etc/hosts 127.0.1.1. successfully to ' + newHostname);
      }
   })
}
