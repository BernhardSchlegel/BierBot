// load the things we need
var mongoose = require('mongoose');

// define the schema for our settings model
var settingSchema = mongoose.Schema({
   voltsMotorCalibValue: Number,
   sudNumber: Number,
   bierBotName: String,
   passwordActivated: Boolean,
   selectedHardware: mongoose.Schema.Types.ObjectId,
   logEveryXsTempValToDBHeat: Number,
   logEveryXsTempValToDBCool: Number,
   displayLastMinutesHeat: Number,
   displayLastMinutesCool: Number,
   manualSetTime: Boolean,
   manualTime: Date,
   languageKey: String,
   sendStatistics: Boolean,
   wifiEnabled: Boolean,
   wlanPassphrase: String,
   wlanSSID: String,
   hardwareRevision: String,
   boilingTempC: Number, // how many degrees celsius are necessary to be considered as boiling?
   defaultSudSize: Number,
   motorWarningChecked: Boolean,
   addToSensorVal: Number,
   telegram: {
     enabled: Boolean,
     token: String,
     chatId: String
   }
});

// create the model for users and expose it to our app
module.exports = mongoose.model('setting', settingSchema);
