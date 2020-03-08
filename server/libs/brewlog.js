// brewlog.js
var winston = require('winston');

// winston.add(winston.transports.Console); // is added by default
winston.remove(winston.transports.Console);
// we treat the console logging on our own
// winston.add(winston.transports.Console, {
// 	level: 'info'
// })
winston.add(winston.transports.DailyRotateFile, {
   level: 'info',
   filename: __dirname + '/../../logs/bierbot.log',
   datePattern: '.yyyy-MM-dd'
});


var exports = module.exports = {};

var curentLogFilePath = null;

var brewdate = null;

// returns date in ms
var getNowDate = function() {
   var now = new Date();
   if (brewdate != null)
      now = brewdate.gcd();

   return new Date(now.getTime() + now.getTimezoneOffset());
}

// logs a string to the console
exports.log = function(str) {
   winston.info(str);
   var currentdate = getNowDate();

   var datestr = ("0" + (currentdate.getDate())).slice(-2) + "." +
      ("0" + (currentdate.getMonth() + 1)).slice(-2) + "." +
      currentdate.getFullYear() + ", " +
      ("0" + currentdate.getHours()).slice(-2) + ":" +
      ("0" + currentdate.getMinutes()).slice(-2) + ":" +
      ("0" + currentdate.getSeconds()).slice(-2);

   console.log(datestr + ' - ' + str);
};

exports.debug = function(str) {
   winston.info(str);
   var currentdate = getNowDate();

   var datestr = ("0" + (currentdate.getDate())).slice(-2) + "." +
      ("0" + (currentdate.getMonth() + 1)).slice(-2) + "." +
      currentdate.getFullYear() + ", " +
      ("0" + currentdate.getHours()).slice(-2) + ":" +
      ("0" + currentdate.getMinutes()).slice(-2) + ":" +
      ("0" + currentdate.getSeconds()).slice(-2);

   console.log(datestr + ' - ' + str);
}

exports.getPathToCurrentLogfile = function(subtractDays) {
   var now = getNowDate();

   now.setDate(now.getDate() - subtractDays);

   var str = now.getFullYear() + "-" +
      ("0" + (now.getMonth() + 1)).slice(-2) + "-" +
      ("0" + (now.getDate())).slice(-2);
   return __dirname + '/../../logs/bierbot.log.' + str;
}

exports.setBrewDateAsync = function(bd) {
   // yeah I know... much hazzle for one but it was late...
   str = 'setting brewdate in brewlog module...';
   winston.info(str);
   var currentdate = getNowDate();

   var datestr = ("0" + (currentdate.getDate())).slice(-2) + "." +
      ("0" + (currentdate.getMonth() + 1)).slice(-2) + "." +
      currentdate.getFullYear() + ", " +
      ("0" + currentdate.getHours()).slice(-2) + ":" +
      ("0" + currentdate.getMinutes()).slice(-2) + ":" +
      ("0" + currentdate.getSeconds()).slice(-2);

   console.log(datestr + ' - ' + str);

   brewdate = bd;
}
