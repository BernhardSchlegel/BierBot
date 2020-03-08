var exports = module.exports = {};

var module = {};

var useSystemDate = true;
var fakeDate = new Date();

var addSecondIntervalID = setInterval(function() {
   fakeDate.setSeconds(fakeDate.getSeconds() + 1);
}, 1000);

exports.setBierBotDate = function(date) {
   if (date instanceof Date) {
      fakeDate = date;
   } else {
      fakeDate = new Date(date);
   }
};

exports.setUsingSystemDate = function(val) {
   useSystemDate = val;
};

// gcd = getCurrentDate
exports.gcd = function() {
   if (useSystemDate == true) {
      return new Date();
   } else {
      return fakeDate;
   }
};
