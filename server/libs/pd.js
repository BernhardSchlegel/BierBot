var exports = module.exports = {};
var precision = 0.1; // NEVER USE 0
var adaptationFinishedTolerance = 0.5; // if overshoot is smaller than this value, no adaptation will happen

var mongoose = require('mongoose');
var Hardware = require('../app/models/hardware');
var Setting = require('../app/models/appsetting');
var brewlog = require('./brewlog');
var plausible = require('./plausible');
var util = require('util'); // brewlog.log(util.inspect(updatedRecipe, false, null));

var kp = 1; // setting the proportional factor
var kd = 1; // setting the differential factor

// adaptation Limits
var adaptLimKpMax = 1;
var adaptLimKpMin = 0.9;

var adaptLimKdMax = 10;
var adaptLimKdMin = 0.1;

var heatingCoolingFn = null; // function pointer to control relais for heating

var brewdate = null;

Array.prototype.max = function() {
   var max = -9999999999;
   for (var i = 0; i < this.length; i++) {
      if (this[i].temp > max) {
         max = this[i].temp
      }
   }
   return max;
};

Array.prototype.min = function() {
   var min = 9999999999;
   for (var i = 0; i < this.length; i++) {
      if (this[i].temp < min) {
         min = this[i].temp
      }
   }
   return min;
};

Array.prototype.avg = function() {
   var sum = 0;
   for (var i = 0; i < this.length; i++) {
      sum += parseFloat(this[i], 10); //don't forget to add the base
   }
   return sum / this.length;
}

// returns true if values are ascending
// timeinMS only the last timeinMS are checked
Array.prototype.asc = function() {
   var tolerance = precision;
   var toleranceUsed = false;
   var delta = 0;

   for (var i = 0; i < this.length; i++) {
      if (i > 0) {
         //brewlog.log('	asc: this[i].temp=' + this[i].temp + '. this[i-1].temp=' + this[i-1].temp);
         // calculate delta
         delta = delta + (this[i].temp - this[i - 1].temp);

         if (this[i].temp < this[i - 1].temp) {
            //brewlog.log('	asc: check for tolerance');
            // if value is outside tolerance range
            if (this[i].temp < (this[i - 1].temp - tolerance)) {
               return false;
            }
            // last value was already toleranced
            if (toleranceUsed == true) { // two times would be too much to call it 'ascending'

               //brewlog.log('	asc: toleranceUsed = true => returning false');
               return false;
            }
            // dont use tolerance for last value, otherwise we would detect same extremum twice
            if (i == (this.length - 1)) {
               return false;
            }
            // value is inside tolerance range
            //brewlog.log('	asc: toleranceUsed = true');
            toleranceUsed = true;
            continue;
         } else {
            //brewlog.log('	asc: toleranceUsed = false');
            toleranceUsed = false;
         }
      }
   }

   //brewlog.log('	asc: returning true');
   if (delta > tolerance) {
      return true;
   } else {
      return false;
   }
};

// returns if values are all the same
Array.prototype.same = function() {
   for (var i = 0; i < this.length; i++) {
      if (i > 0) {
         if (this[i].temp != this[i - 1].temp) {
            return false;
         }
      }
   }

   return true;
};

Array.prototype.desc = function() {
   var toleranceUsed = false;
   var delta = 0;


   for (var i = 0; i < this.length; i++) {
      if (i > 0) {
         delta = delta + (this[i].temp - this[i - 1].temp);

         if (this[i].temp > this[i - 1].temp) {
            // if value is outside tolerance range
            if (this[i].temp > (this[i - 1].temp + precision)) {
               return false;
            }
            // last value was already toleranced
            if (toleranceUsed == true) { // two times would be too much to call it 'descending'
               return false;
            }
            // dont use tolerance for last value, otherwise we would detect same extremum twice
            if (i == (this.length - 1)) {
               return false;
            }
            // value is inside tolerance range
            toleranceUsed = true;
            continue;
         } else {
            toleranceUsed = false;
         }
      }
   }


   //brewlog.log('	asc: returning true');
   if (delta < (-1 * precision)) {
      return true;
   } else {
      return false;
   }
};

Array.prototype.gap = function(maxgap) {

   for (var i = 0; i < this.length; i++) {
      if (i > 0) {
         if ((this[i].temp > (this[i - 1].temp + maxgap)) ||
            (this[i].temp < (this[i - 1].temp - maxgap))) {

            brewlog.log('unplausible gap detected between ' + this[i].temp + ' and ' + this[i - 1].temp)
            return true;
         }
      }
   }

   return false;
};

///////////////////////////////////////////////////////////////////////////////
// General Stuff
///////////////////////////////////////////////////////////////////////////////

var firstIsLarger = function(val1, val2) {
   var round = 1 / precision;

   val1r = Math.round(val1 * round) / round;
   val2r = Math.round(val2 * round) / round;

   if (val1r > (val2r)) {
      return true;
   }
   return false;
}
var firstIsSmaller = function(val1, val2) {
   var round = 1 / precision;

   val1r = Math.round(val1 * round) / round;
   val2r = Math.round(val2 * round) / round;

   if ((val1r) < val2r) {
      return true;
   }
   return false;
}

// returns date in ms
var getNowDate = function() {
   var now = new Date();
   if (brewdate != null)
      now = brewdate.gcd();

   return new Date(now.getTime() + now.getTimezoneOffset());
}

// also in app.js (clientside)
var getTimeDiffMinutes = function(date1, date2) {
   date2 = new Date(date2);
   date1 = new Date(date1);
   var diffInMs = date2.getTime() - date1.getTime();
   var retString = '';

   if (diffInMs > 0) {

      return diffInMs / 1000 / 60;
   }

   return 0;
}

// also in app.js (clientside)
var getTimeDiffSeconds = function(date1, date2) {
   date2 = new Date(date2);
   date1 = new Date(date1);
   var diffInMs = date2.getTime() - date1.getTime();
   var retString = '';

   if (diffInMs > 0) {

      return diffInMs / 1000;
   }

   return 0;
}

///////////////////////////////////////////////////////////////////////////////
// PD Control
///////////////////////////////////////////////////////////////////////////////f

// type can be either 'max'/'heat' or 'min'/'cool'
var lastValues = []; // last values used for debouncing max/min detection
var lastValStoreSize = adaptationFinishedTolerance / precision;
var historyLastTemp = null;
// returns true if temp value changed
var addTempToHistory = function(temp) {
   var round = 1 / precision;
   var returnVal = false;
   if (Math.round(temp * round) / round != Math.round(historyLastTemp * round) / round) {
      // temp value changed
      lastValues.push({
         temp: Math.round(temp * round) / round,
         time: getNowDate()
      });
      lastValues = lastValues.slice(-lastValStoreSize); // limit to 10 values
      returnVal = true;
      historyLastTemp = temp;
   }

   return returnVal;
}

var lastMax = -9999;
var lastMin = 9999;

var ignoreMax = true; // ignore first ones (unvalid, because of 99999)
var ignoreMin = true; // ignore first ones (unvalid, because of 99999)
var detectionDebounceCounter = 0;
var detect = function(type, value) {


   // make values plausible
   if (lastValues.gap(3)) {
      brewlog.log('unplausible gap detected between in lastValues: ' + util.inspect(lastValues, false, null));
      return false;
   }

   if (type == 'max' || type == 'heat') {
      var maxLast = lastValues.max();
      //brewlog.log('		maxLast = ' +maxLast  + ', value=' + value);
      //brewlog.log('		lastValues = ' + util.inspect(lastValues, false, null));
      //brewlog.log('		asc=' + lastValues.asc(precision,60 * 1000));
      //brewlog.log('		firstIsLarger=' + firstIsLarger(maxLast, value,precision));
      if (firstIsLarger(maxLast, value) &&
         (lastValues.asc() || lastValues.same())
      ) { // only use last 30s. Either ascending values or ALL the same
         lastMax = value;
         if (ignoreMax == true) {
            ignoreMax = false
            brewlog.log('ignored max detected! lastMax=' + lastMax + ', value=' + value + ', maxLast=' + maxLast + ', values=' + util.inspect(lastValues, false, null));
            return false;
         }

         brewlog.log('max detected! lastMax=' + lastMax + ', value=' + value + ', maxLast=' + maxLast + ', values=' + util.inspect(lastValues, false, null));
         return true;
      }
   } else if (type == 'min' || type == 'cool') {
      var minLast = lastValues.min();
      if (firstIsSmaller(minLast, value) &&
         (lastValues.desc() || lastValues.same())
      ) { // use last 1h

         //brewlog.log(util.inspect(lastValues, false, null));
         lastMin = value;
         if (ignoreMin == true) {
            ignoreMin = false
            brewlog.log('ignored min detected! lastMin=' + lastMin + ', value=' + value + ', minLast=' + minLast);
            return false;
         }

         brewlog.log('min detected! lastMin=' + lastMin + ', value=' + value + ', minLast=' + minLast);
         return true;
      }
   }

   return false;
}

// no complex mathemathics, just plain derivation, of the last
var CPerMinSmoothed = null;
var CPerMinSmoothingFactor = 15;
var CPerminUseLastXSeconds = 30;
var getCperMin = function() {
   var valueCount = lastValues.length;

   if (valueCount > 2) {

      var currentVal = lastValues[valueCount - 1];
      var lastVal = null;
      var nowDate = getNowDate().getTime(); // now in ms since big bang
      var timeMs = CPerminUseLastXSeconds * 1000;

      for (var i = (valueCount - 2); i >= 0; i--) {
         // timestamp of element has to LARGER than
         // nowdate - the time intervall
         if (lastValues[i].time.getTime() > nowDate - timeMs) {
            lastVal = lastValues[i];
         }
      }

      if (lastVal == null) {
         // although there are two elements in array, they are not
         // seperated by at least CPerminUseLastXSeconds
         return 0.1;
      }

      // calculate cpermin
      var diffInMS = currentVal.time.getTime() - lastVal.time.getTime();
      var deltaT = currentVal.temp - lastVal.temp;
      var diffInS = diffInMS / 1000;
      var CperMin = deltaT / (diffInS / 60);

      // only use value, if relais is on
      //if (lastRelaiState == 1) {
      // smooth
      CPerMinSmoothed = (CPerMinSmoothed * (CPerMinSmoothingFactor - 1) + CperMin) / CPerMinSmoothingFactor;
      //}

      return Math.abs(CPerMinSmoothed); // always positive
   }

   return 0.1; // default value
}



var addTempToHistory = function(temp) {
   var round = 1 / precision;
   var returnVal = false;
   if (Math.round(temp * round) / round != Math.round(historyLastTemp * round) / round) {
      // temp value changed
      lastValues.push({
         temp: Math.round(temp * round) / round,
         time: getNowDate()
      });
      lastValues = lastValues.slice(-lastValStoreSize); // limit to 10 values
      returnVal = true;
      historyLastTemp = temp;
   }

   return returnVal;
}







// is used to adapt kd according to the current piece of hardware and beer amount
// call cyclic
// mode = 'heat' or 'cool'
var lastTargetTemp = null;
var ignoreMaxAdapt = false; // if true, adaptation will ignore next max
var ignoreMinAdapt = false; // if true, adaptation will ignore next min

var differenceSmallStep = 1; // delta T so that overshoot counts as small overshoot
var adaptationStepSmall = 0.01; // step in which kd will be adjusted
var adaptationStepLarge = 0.03; // step in which kd will be adjusted

var lastAdaptation = null;
var adaptationDebounce = 30000; // milliseoncds

var adapt = function(controlState, currentTemp, deltaCperMin) {

   // first: check for NaNs
   if (isNaN(kd)) {
      kd = 1.4;
   }
   if (isNaN(kp)) {
      kp = 1;
   }

   var updateHappened = false;
   var targetTemp = 20;
   var kdBackup = kd;
   var kpBackup = kp;
   if (controlState.targetTemperature != null) {
      targetTemp = controlState.targetTemperature;
   } else {
      return;
   }

   // magic happens only on debounced max/min
   if (detect(controlState.mode, currentTemp) == true) {

      //
      if ((lastAdaptation + adaptationDebounce) > getNowDate()) {
         brewlog.log('adaptation skipped: debounce (last adaptation was only ' + (getNowDate() - lastAdaptation) / 1000 + 's ago)');
      }

      if (lastValues.length != lastValStoreSize) {
         // only adapt, if there are enough temperature values
         brewlog.log('adaption skipped: lastValues not ready (count=' + lastValues.length + '/' + lastValStoreSize + ')');
         return;
      }

      // dont adapt if maximums of hardware is reached (e.g. -5C frige, 95C heating)
      // so only  adapt if heating / cooling = relais is turned off a max/min is detected
      if (lastRelaiState != 0) {
         brewlog.log('adaption skipped: lastRelaiState=' + lastRelaiState);
         return;
      }

      // that no adapation happens after targettemp change, e.g.:
      // step 1: temp = 30, targettemp = 30
      // step 2: temp = 30, targettemp = 20 => would result in adaptation with a overshoot of 10C
      // setting last targettemp is done at the end of adpat()
      if (controlState.mode == 'heat' && ignoreMaxAdapt) {
         brewlog.log('adaption skipped: maximum ignore since targetTemperature was lowered');
         ignoreMaxAdapt = false;
         return;
      }
      if (controlState.mode == 'cool' && ignoreMinAdapt) {
         brewlog.log('adaption skipped: minimum ignore since targetTemperature was raised');
         ignoreMinAdapt = false;
         return;
      }

      // lastTemp has to be
      if (controlState.mode == 'heat') {
         var delta = currentTemp - targetTemp;
         var kd_tgt = delta / deltaCperMin;

         // alter kd
         var adaptationVal = 0;
         if (delta < differenceSmallStep && delta > (-1 * differenceSmallStep)) {
            brewlog.log('adapting small step');
            adaptationVal = adaptationStepSmall;
         } else { // large step
            brewlog.log('adapting large step');
            adaptationVal = adaptationStepLarge;
         }

         if (delta > 0) {
            kd = kd + adaptationVal;
            brewlog.log('raising kd to ' + kd + '...');
         } else {
            kd = kd - adaptationVal;
            brewlog.log('lowering kd to ' + kd + ' ...');
         }

         // log
         brewlog.log('delta=' + delta + ', deltaCperMin=' + deltaCperMin + ', kd=' + kd);
         updateHappened = true;
         lastAdaptation = getNowDate();
      } else if (controlState.mode == 'cool') {
         var delta = targetTemp - currentTemp; // overshoots are positive
         var kd_tgt = delta / deltaCperMin;

         // alter kd
         var adaptationVal = 0;
         if (delta < differenceSmallStep && delta > (-1 * differenceSmallStep)) {
            adaptationVal = adaptationStepSmall;
         } else { // large step
            adaptationVal = adaptationStepLarge;
         }

         if (delta > 0) {
            kd = kd - adaptationVal;
         } else {
            kd = kd + adaptationVal;
         }

         // log
         brewlog.log('delta=' + delta + ', deltaCperMin=' + deltaCperMin + ', kd=' + kd);
         updateHappened = true;
      }

      // update hardware specific starting kd
      //var floatingAvgNumDatabase = 1;
      if (updateHappened === true) {
         Setting.findOne(function(err, appSettings) {
            if (err) {
               brewlog.log('updating kd/kp failed: ' + err);
            } else {
               Hardware.findById(appSettings.selectedHardware, function(err, hardware) {
                  if (err) {
                     brewlog.log('getting hardware failed: ' + err);
                  } else {
                     if (hardware.pd.manual == true) {
                        // manual mode, no adaptation desired, is done in this section so
                        // that number of database accesses is smaller
                        // ==> roll back changes and return

                        brewlog.log('manual mode detected. Rolling back adapted changes (kd=' + kd + ', kp=' + kp + ')');

                        kd = kdBackup;
                        kp = kpBackup;
                        return;
                     }

                     // otherwise _id is write protected
                     hardware = hardware.toObject();

                     // calculate variables used for adaptating kp
                     var overshoot = currentTemp - targetTemp;
                     if (overshoot <= adaptationFinishedTolerance && overshoot >= (-1 * adaptationFinishedTolerance)) {
                        brewlog.log('overshoot is zero, apadtation finished ... skipping.');
                        return;
                     }

                     // // allow kd only to
                     // // - get smaller if overshoot is negative in heating
                     // // - get smaller if overshoot is positive in cooling
                     // if ( ((kd < kdBackup) && (overshoot > 0 && controlState.mode == 'heat') ||
                     // 	 ((kd < kdBackup) && overshoot < 0 && controlState.mode == 'cool')  ) {
                     // 	brewlog.log('adaption skipped, since would lead to wrong direction ...');

                     // 	kd = kdBackup;
                     // 	kp = kpBackup;
                     // 	return;
                     // }


                     var turnOffTemp = targetTemp - overshoot;
                     var kdAvg = hardware.pd.kd;
                     brewlog.log('overshoot=' + overshoot + ', turnOffTemp=' + turnOffTemp + ', kdAvg=' + kdAvg);
                     brewlog.log('deltaCperMin=' + deltaCperMin + ', targetTemperature=' + targetTemp);
                     // bugfix, e.g. ( -1 + 10 * 0.1 ) / 0 gives kp = NaN
                     if (targetTemp == 0) {
                        targetTemp = 0.0001;
                     }
                     // do calc
                     kp = (turnOffTemp + kdAvg * deltaCperMin) / targetTemp;
                     if (kp > adaptLimKpMax || kp < adaptLimKpMin) {
                        brewlog.log('adapting kp to ' + kp + ' not possible (min=' + adaptLimKpMin + ', max=' + adaptLimKpMax + ')');

                        if (kp > adaptLimKpMax) {
                           kp = adaptLimKpMax;
                        }
                        if (kp < adaptLimKpMin) {
                           kp = adaptLimKpMin;
                        }
                     }
                     if (kd > adaptLimKdMax || kd < adaptLimKdMin) {
                        brewlog.log('adapting kd to ' + kd + ' not possible (min=' + adaptLimKdMin + ', max=' + adaptLimKdMax + ')');

                        if (kd > adaptLimKdMax) {
                           kd = adaptLimKdMax;
                        }
                        if (kd < adaptLimKdMin) {
                           kd = adaptLimKdMin;
                        }
                     }

                     // calculate floating average and update dataase
                     hardware.pd.kd = kd; //(hardware.pd.kd * (floatingAvgNumDatabase-1) + kd) / floatingAvgNumDatabase;
                     hardware.pd.kp = kp; //(hardware.pd.kp * (floatingAvgNumDatabase-1) + kp) / floatingAvgNumDatabase;

                     // kd
                     kd = hardware.pd.kd;

                     brewlog.log('adapted kp to ' + kp);
                     brewlog.log('adapted kd to ' + kd);


                     // get the _id since _id cannot be replaced in mongoDB
                     var id = hardware._id

                     // remove from old object
                     delete hardware._id;

                     // Do the upsert, which works like this: If no Contact document exists with
                     // _id = contact.id, then create a new doc using upsertData.
                     // Otherwise, update the existing doc with upsertData
                     Hardware.update({
                        _id: id
                     }, hardware, {
                        upsert: true
                     }, function(err, updatedHardware) {
                        if (err) {
                           brewlog.log('failed to update hardware: ' + err);
                        }
                     });

                  }
               });
            }
         });
      }
   }
};

var lastRelaiState = 0;
var lastDebugLog = getNowDate();
var logIntervallMS = 60000;

var control = function(controlState, currentTemp, deltaCperMin) {
   var targetTemp = 20;
   if (controlState.targetTemperature != null) {
      targetTemp = controlState.targetTemperature;

      if (targetTemp != lastTargetTemp) {
         if (targetTemp < lastTargetTemp) {
            ignoreMaxAdapt = true;
         }
         if (targetTemp > lastTargetTemp) {
            ignoreMinAdapt = true;
         }
         brewlog.log('targetTemperature changed from ' + lastTargetTemp + 'C to ' + targetTemp + 'C');
      }
   } else {
      return;
   }


   Setting.findOne(function(err, appSettings) {
      if (err) {
         brewlog.log('controlling failed due to missing settings: ' + err);
      } else {

         Hardware.findById(appSettings.selectedHardware, function(err, hardware) {
            if (err) {
               brewlog.log('getting hardware failed: ' + err);
            } else if (hardware) {
               var relaisChanged = false;

               if (controlState.mode == 'heat') {
                  if (currentTemp >= (kp * targetTemp - kd * deltaCperMin)) {
                     if (0 != lastRelaiState) {
                        brewlog.log('relais off. currentTemp=' + currentTemp + ', targetTemp=' + targetTemp + ', kd=' + kd + ', deltaCperMin=' + deltaCperMin);
                        relaisChanged = true;
                     }
                     heatingCoolingFn(0);
                     lastRelaiState = 0;
                  }

                  if (currentTemp <= (kp * targetTemp - hardware.pd.hysteresis - kd * deltaCperMin)) {
                     if (1 != lastRelaiState) {
                        brewlog.log('relais on. currentTemp=' + currentTemp + ', targetTemp=' + targetTemp + ', kd=' + kd + ', kd=' + kd + ', deltaCperMin=' + deltaCperMin + ', hysteresis=' + hardware.pd.hysteresis);
                        relaisChanged = true;
                     }
                     heatingCoolingFn(1);
                     lastRelaiState = 1;
                  }
               } else if (controlState.mode == 'cool') {

                  if (currentTemp <= (kp * targetTemp + kd * deltaCperMin)) {
                     if (0 != lastRelaiState) {
                        brewlog.log('relais off. currentTemp=' + currentTemp + ', targetTemp=' + targetTemp + ', kd=' + kd + ', deltaCperMin=' + deltaCperMin);
                        relaisChanged = true;
                     }
                     heatingCoolingFn(0);
                     lastRelaiState = 0;
                  }
                  if (currentTemp >= (kp * targetTemp + hardware.pd.hysteresis + kd * deltaCperMin)) {
                     if (1 != lastRelaiState) {
                        brewlog.log('relais on. currentTemp=' + currentTemp + ', targetTemp=' + targetTemp + ', kd=' + kd + ', deltaCperMin=' + deltaCperMin + ', hysteresis=' + hardware.pd.hysteresis);
                        relaisChanged = true;
                     }
                     heatingCoolingFn(1);
                     lastRelaiState = 1;
                  }
               }


               // logging every 30s or if relais changed
               if (lastDebugLog < (getNowDate() - logIntervallMS) || relaisChanged == true) {

                  brewlog.debug('currentTemp=' + Math.round(currentTemp * 100) / 100 + ', targetTemp=' + Math.round(targetTemp * 100) / 100 + ', kd=' +
                     Math.round(kd * 100) / 100 + ', kp=' + Math.round(kp * 100) / 100 + ', dcm=' + Math.round(deltaCperMin * 100) / 100 +
                     ', lrs=' + lastRelaiState + ', h=' + hardware.pd.hysteresis);
                  brewlog.debug('turnOffT_h= ' + Math.round((kp * targetTemp - kd * deltaCperMin) * 100) / 100 + ', turnOnT_h=' +
                     Math.round((kp * targetTemp - hardware.pd.hysteresis - kd * deltaCperMin) * 100) / 100);
                  brewlog.debug('turnOffT_c= ' + Math.round((kp * targetTemp + kd * deltaCperMin) * 100) / 100 + ', turnOnT_c=' +
                     Math.round((kp * targetTemp + hardware.pd.hysteresis + kd * deltaCperMin) * 100) / 100);

                  lastDebugLog = getNowDate();
               }
            } else {
               brewlog.log('no hardware selected.');
            }
         });
      }
   });

   // set last targettemp
   if (controlState.targetTemperature != null) {
      lastTargetTemp = controlState.targetTemperature;
   }
}

// call this function once on startup
// [exported]
exports.setup = function(setHeatingCoolingFn) {
   heatingCoolingFn = setHeatingCoolingFn;

   reset();
}

// call this upon started recipe, adaptions will be resetted
var reset = function() {
   brewlog.log('resetting pd controller ...');

   lastValues = []; // last values used for debouncing max/min detection
   lastMax = -9999;
   lastMin = 9999;

   Setting.findOne(function(err, appSettings) {
      if (err) {
         brewlog.log('getting settings for restoring kd/kp failed ' + err);
      } else {
         Hardware.findById(appSettings.selectedHardware, function(err, hardware) {
            if (err) {
               brewlog.log('getting hardware failed: ' + err);
            } else if (hardware) {
               // calculate floating average
               kp = hardware.pd.kp;
               kd = hardware.pd.kd;

               brewlog.log('initialized kp(' + kp + ') and kd(' + kd + ')');
            } else {
               brewlog.log('no hardware selected.');
            }
         });
      }
   });
}
exports.reset = reset;


exports.deltaCperMin = 0;
// call this function cyclic
// IMPORTANT: CALL EVERY 1s!!!
// [exported]
// force is used when next step is set, to prevent long waiting time because temperature doesnt change
var cyclicLastTemp = null;
exports.cyclic = function(controlState, currentTemp, force) {

   // get deltaCperMin
   exports.deltaCperMin = getCperMin(controlState, currentTemp);

   // rounding
   var round = 1 / precision;

   // round currentTemp
   currentTemp = Math.round(currentTemp * round) / round;

   if ((Math.round(currentTemp * round) / round != Math.round(historyLastTemp * round) / round) ||
      force == true) {
      // kd adapation
      adapt(controlState, currentTemp, exports.deltaCperMin);

      // control, take action
      control(controlState, currentTemp, exports.deltaCperMin);
   }

   // add the currentTemp to the innovatige (and hopefully working)
   // min max detection
   addTempToHistory(currentTemp);

}

exports.setBrewDateAsync = function(bd) {
   brewlog.log('setting brewdate in pd module...');
   brewdate = bd;
}
