var brewlog = require('./brewlog');

var toleranceDifference = 3;
var lastPlausibleValue = null;
var lastValue = null;
module.exports.temp = function(value) {

   if (typeof(value) != "number") {
      //brewlog.log('temperature is no number ... returning.');
      return false;
   }


   if (lastPlausibleValue == null) {
      lastPlausibleValue = value;
   }

   // value within toleranceDifference
   if (value <= (lastPlausibleValue + toleranceDifference) &&
      value >= (lastPlausibleValue - toleranceDifference)) {

      lastPlausibleValue = value;
      lastValue = value;

      return true;
   }

   // two times the same value
   if (value == lastValue) {
      brewlog.log('two times same value (' + value + ')');
      lastPlausibleValue = value;
      return true;
   }


   brewlog.log('unplausible value detected (val=' + value + ', lastVal=' + lastValue + ')');
   lastValue = value;
   return false;
};
