(function() {

   //define a global application
   var App = angular.module('BrewApp', ['Services', 'ngRoute', 'nvd3ChartDirectives',
      'as.sortable', 'ui.bootstrap', 'pascalprecht.translate', 'angular-google-analytics'
   ]);
   var temp1 = null;
   var brew = null;
   var alertShowTimeMS = 5000;

   // constants, dont dare to change!
   var chartDataTempIdx = 0;
   var chartDataStepIdx = 1;
   var chartDataStirrIdx = 2;

   // catch all errors
   App.factory('$exceptionHandler', function() {
      return function errorCatcherHandler(exception, cause) {
         console.error(exception.stack);
         console.error("exception: angular exceptionHandler called.", exception);
      };
   });

   //create an app router for url management and redirect
   App.config(["$routeProvider", "$compileProvider", "$translateProvider", "AnalyticsProvider",
      function($routeProvider, $compileProvider, $translateProvider, AnalyticsProvider) {
         try {
            // making the blob safe
            var oldWhiteList = $compileProvider.aHrefSanitizationWhitelist();
            $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|file|blob):|data:image\//);

            $routeProvider.when('/frontpage', {
               templateUrl: 'partials/frontpage.html',
               controller: 'FrontpageController',
            });
            $routeProvider.when('/automatic', {
               templateUrl: 'partials/auto.html',
               controller: 'FrontpageController',
            });
            $routeProvider.when('/manual', {
               templateUrl: 'partials/manual.html',
               controller: 'FrontpageController',
            });
            $routeProvider.when('/recipes', {
               templateUrl: 'partials/recipes.html',
               controller: 'RecipesController',
            });
            $routeProvider.when('/calibration', {
               templateUrl: 'partials/advanced/calibration.html',
               controller: 'FrontpageController',
            });
            $routeProvider.when('/settings', {
               templateUrl: 'partials/settings.html',
               controller: 'SettingsController',
            });
            $routeProvider.when('/logs', {
               templateUrl: 'partials/logs.html',
               controller: 'LogsController',
            });
            $routeProvider.when('/log/:logID', {
               templateUrl: 'partials/logdetail.html',
               controller: 'DisplayLogController',
            });
            $routeProvider.when('/logcsv/:logID', {
               templateUrl: 'partials/logdetailcsv.html',
               controller: 'DisplayCSVLogController',
            });
            $routeProvider.otherwise({
               redirectTo: '/frontpage'
            });

            // LANGUAGE
            $translateProvider.translations('en_US', {
               ADD: 'Add',
               ABORT: 'Abort',
               BREW: 'Brew',
               ACTIVATE: 'Activate',
               CLOSE: 'Close',
               COOL: 'Cooling',
               DANGER: 'Danger',
               DESC: 'Description',
               DUPLICATE: 'Duplicate',
               EDIT: 'Edit',
               EXPORT: 'Export',
               HEAT: 'Heating',
               IMPORT: 'Import',
               IMPORTANT: 'Important',
               LAN: 'LAN',
               MANUAL: 'Manual',
               MODE: 'Mode',
               NAME: 'Name',
               NEW: 'New',
               NO: 'No',
               LOADING: 'Loading ...',
               OFF: 'Off',
               ON: 'On',
               RESETTING: 'Restarting...',
               SAVE: 'Save',
               SEND: 'Send!',
               SUDNUMBER: 'Sudnumber',
               START: 'Start',
               STIRR: 'Stirr',
               STIRRING: 'Stirring',
               TEMPERATUREHISTORY: 'Temperature history',
               TTEMP: 'Target temperature',
               TIME: 'Time',
               WLAN: 'WLAN',
               YES: 'Yes',
               NAV_AUTO: 'Automatic',
               NAV_MANUAL: 'Manual',
               NAV_RECIPES: 'Recipes',
               NAV_LOGS: 'Logs',
               NAV_SETTINGS: 'Settings',
               SURE: 'Sure?',
               WARNING: 'Warning:',
               IDX_UPDATEAVAILALBE: 'Update available!',
               HOME_H: 'Welcome',
               HOME_T: 'The BierBot greets! Basically two operation modes are supported: Automatic and manual.',
               HOME_HMANUAL: 'Manual',
               HOME_TMANUAL: 'Manual mode allows controlling everything by hand. Only the set target temperature is automatically held by the BierBot. Logging is turned off in this mode.',
               HOME_HAUTO: 'Automatic',
               HOME_TAUTO: 'Use this mode to brew predefined recipes. This can be either a mashing/brewing recipe (heating mode) or a fermenting recipe (cooling mode). To get started, create a new recipe with the menu entry recipes. In this mode, all existing data will be log. After finishing the log can be viewed under logs. The detailled log (magnifier-button) is intentionally printing friendly.',
               AUTO_NOTLOADED_1: 'Currently, no recipe is loaded. In order to change that, please click on ',
               AUTO_NOTLOADED_2: 'and open a recipe with the',
               AUTO_NOTLOADED_3: 'button. Afterwards, click the',
               AUTO_NOTLOADED_4: '-Button.',
               AUTO_START: 'Start',
               AUTO_NEXT: 'Next step',
               AUTO_LOG: 'Add comment',
               AUTO_STOP: 'Stop',
               AUTO_RECIPESTARTED: 'Recipe started.',
               AUTO_STEPSTARTED: 'Step started',
               AUTO_TEMPREACHED: 'Temperature reached',
               AUTO_STEPFINISHED: 'Step finished',
               AUTO_TIMEREMAINING: 'Remaining time',
               AUTO_CURTEMP: 'Current temperature',
               AUTO_LOGS: 'Comments',
               AUTO_ABORTREALLY: 'Do you really want to abort the process? Resuming is not possible!',
               AUTO_ADDCOMMENT: 'Add comment',
               AUTO_SHARE: 'Spread the word!',
               MANUAL_WARNMOTOR: 'Before using the motor, please confirm the warning shown on the settings page.',
               MANUAL_ERROR_1: 'As long as a recipe is loaded, the manual mode is deactivated. To change that, please use the "Stop" button on the ',
               MANUAL_ERROR_2: 'to stop the current recipe.',
               MANUAL_CONTROLS: 'Controls',
               MANUAL_STOPSWITCH: 'Stop-Switch',
               MANUAL_STOPSWITCH_BTN: 'Stop',
               RECIPES_IMPORT_BEERXML: 'Import BeerXML',
               RECIPES_EXPORT_BEERXML: 'Export BeerXML',
               RECIPES_BREW: 'Brew',
               RECIPES_EDIT: 'Edit',
               RECIPES_ADD: 'Add',
               RECIPES_DUPLICATE: 'Duplicate',
               RECIPES_RECIPENAME: 'Recipename',
               RECIPES_DESCRIPTION: 'Description',
               RECIPES_ABORTCRITERIA: 'Next step when',
               RECIPES_ACTIME: 'time passed',
               RECIPES_ACMANUAL: 'manual button press',
               RECIPES_MODALRECIPE_EDIT: 'Edit recipe',
               RECIPES_MODALRECIPE_NAME: 'Recipename',
               RECIPES_MODALRECIPE_DESC: 'Description',
               RECIPES_MODALRECIPESTEP_EDIT: 'Edit recipestep',
               RECIPES_MODALRECIPESTEP_NAME: 'Name',
               RECIPES_MODALRECIPESTEP_ABORTCRITERIA: 'Next step when',
               RECIPES_MODALRECIPESTEP_TIME: 'time passed',
               RECIPES_MODALRECIPESTEP_MANUAL: 'manual button press',
               RECIPES_MODALRECIPESTEP_HOURS: 'Hours',
               RECIPES_MODALRECIPESTEP_MINUTES: 'Minutes',
               RECIPES_MODALRECIPESTEP_DURATION: 'Duration',
               RECIPES_MODALRECIPESTEP_TEMP: 'Temperature',
               RECIPES_MODALRECIPESTEP_STIRR: 'Stirring',
               RECIPES_IMPORT_HEADER: 'Import recipes',
               RECIPES_IMPORT_BEERXML_HEADER: 'Import BeerXML recipes',
               RECIPES_IMPORT_CHOSEFILE: 'Choose file(s)',
               RECIPES_IMPORT_IMPORTBTN: 'Import',
               LOGS_SEARCH: 'Search',
               LOGS_AMOUNT: 'Amount',
               LOGS_FINISHED: 'Finished',
               LOGS_DURATION: 'Duration',
               LOGS_MODE: 'Mode',
               LOGS_DELETE_REALLY_1: 'Do you really want to delete the log ',
               LOGS_DELETE_REALLY_2: 'irreversibly',
               LOGS_NOLOGS: 'No logs found. Logs will show up here automatically after a automatic-prozess is finished.',
               LOGDETAIL_BACK: 'Back',
               LOGDETAIL_BREWREPORT: 'Report: {{name}}',
               LOGDETAIL_OVERVIEW: 'Overview',
               LOGDETAIL_RECIPESTEPS: 'Recipe steps',
               LOGDETAIL_NAME: 'Name',
               LOGDETAIL_PROCESSSTARTED: 'Process started',
               LOGDETAIL_PROCESSFINISHED: 'Process finished',
               LOGDETAIL_DURATION: 'Duration',
               LOGDETAIL_SUDSIZE: 'Amount',
               LOGDETAIL_START: 'Start',
               LOGDETAIL_TEMPREACHED: 'Temp. reached',
               LOGDETAIL_DURATIONREACH: 'Duration (approaching)',
               LOGDETAIL_DURATIONHOLD: 'Duration (holding)',
               LOGDETAIL_AVGTEMPHOLD: '{{avg}} (Holding)',
               LOGDETAIL_COMMENTS: 'Comments',
               LOGDETAILCSV_DOWNLOAD: 'Download',
               SETTINGS_REBOOT: 'Reboot required',
               SETTINGS_REBOOTDESC: 'To apply the changes, the BierBot needs to be reboted.',
               SETTINGS_REBOOTDESC_NOW: 'Reboot now',
               SETTINGS_REBOOTDESC_LATER: 'Not now',
               SETTINGS_LANG_H: 'Language',
               SETTINGS_LANG_LANG: 'Choose language',
               SETTINGS_LANG_LANGDESC: 'Choose your preferred language.',
               SETTINGS_GENERAL: 'General',
               SETTINGS_INTERFACE_HEADER: 'Activate WiFi',
               SETTINGS_MOTORV_PRE_WRN: 'Proceed with extreme caution.',
               SETTINGS_MOTORV_PRE_TEXT: 'For the love of good. I SWEAR that I checked the list of compatible motors listed in the link given below and that I will not connect some crappy, non PWM-compatible Motor. I\'m aware, that non-observance of this warning can cause serious damage to the BierBot',
               SETTINGS_MOTORV_PRE_LINKTEXT: 'List of compatible motors',
               SETTINGS_MOTORV_PRE_BTN: 'I did check that link.',
               SETTINGS_MOTORV: 'Stirring speed',
               SETTINGS_MOTORVDESC: 'Volts value to let you control your stirring speed individually.',
               SETTINGS_MOTORVWARN: 'Prior to setting this value check in any case what the max volts value of the connected motor is (typical values are 12V or 24V). The number set here, must not exceed the maximum and operation voltages given on the motor - otherwise the motor will be damaged permanently. Motor power must not exceed 50W.',
               SETTINGS_INTERFACE: 'Interface',
               SETTINGS_INTERFACEDESC: 'Select which interface to use. Attention: After selecing a different interface the IP is due to change. If you misspelled your WiFi password, don\'t worry: The BierBot will be still available over the ehternet interface.',
               SETTINGS_WLANSSID: 'WiFi name (SSID)',
               SETTINGS_WLANSSIDDESC: 'Please enter the name of your local wireless network.',
               SETTINGS_WLANPW: 'WiFi passphrase',
               SETTINGS_WLANPWDESC: 'Enter the passphrase of your network.',
               SETTINGS_NEXTSUDNUM: 'Next sudnumber',
               SETTINGS_NEXTSUDNUMDESC: 'This number is automatically increased after every sud (heating process). This is intended to help you keep track of your different logs and brews.',
               SETTINGS_RESET: 'Reset BierBot',
               SETTINGS_RESETDESC: 'Restore factory defaults. Anything but your stored logs will be deleted.',
               SETTINGS_REBOOTMANUAL: 'Reboot BierBot',
               SETTINGS_REBOOTMANUALDESC: 'If you want to reboot your BierBot just enter \"bierbot\" and click the reboot-button',
               SETTINGS_REBOOTPLACEHOLDER: 'enter \"bierbot\"',
               SETTINGS_REBOOTBTN: 'reboot',
               SETTINGS_BIERBOTNAME: 'BierBot Name',
               SETTINGS_BIERBOTNAMEDESC: 'Give your BierBot a unique name. If you own more than one, this helps you differentiate between them.',
               SETTINGS_HW: 'Hardware',
               SETTINGS_HWSETUP: 'Hardware setup',
               SETTINGS_HWDESC: 'The BierBot learns about your hardware. Since you probably own more than one heating or cooling device (different hotplates, fridge, heating lamp) it\'s possible to create mutliple hardwares.',
               SETTINGS_HWHYSTERESIS: 'Hystersis',
               SETTINGS_HWHYSTERESISDESC: 'The hysteresis sets, how many degree centigrade the current temperature has to differ from the target temperature, before the heating or cooling is turned on again.',
               SETTINGS_HWADDNEW: 'Add new hardware',
               SETTINGS_HWEDIT: 'Edit hardware',
               SETTINGS_COMMAPLEASE: 'Please enter a comma value.',
               SETTINGS_VAVLIDVOLTSPLEASE: 'Please enter a value between 8 and 24 Volts.',
               SETTINGS_NAMEPLEASE: 'Your BierBot wants to have a nickname.',
               SETTINGS_SUDNUMPLEASE: 'Please enter a valid sudnumber for your next brew.',
               SETTINGS_HWEXPERTMODE: 'Expertmode',
               SETTINGS_HWEXPERTMODEDESC: 'If the expertmode is enabled, the BierBot will not adapt automatically to your brewing equipment. You can set the regulating parameters completely on your own. Instability and overshoots are possible. Only choose the expert mode if you\'re familar with the characteristics of a pd-control.',
               SETTINGS_PLEASEUSEEXPERTMODE: 'Please use the expertmode to calibrate the pd-control on your own.',
               SETTINGS_HWKPDESC: 'Controls the influcence of the p-part on the control. Higher values result in taking the current temperature more into account.',
               SETTINGS_HWKDDESC: 'Controls the influcence of the d-part on the control. Higher values result in taking the current change of the temperature more into account.',
               SETTINGS_DATE: 'Date and time',
               SETTINGS_DATEMANUAL: 'Manually set date and time',
               SETTINGS_DATEMANUALDESC: 'If the BierBot has no connection to the internet, this options lets you set the value manually.',
               SETTINGS_CLOCK: 'Clock',
               SETTINGS_PW: 'Password',
               SETTINGS_PWPROTECT: 'Password protection',
               SETTINGS_PWDESC: 'To protect your BierBot from unauthorized access, active the password protection. This is espacially recommended if the BierBot can be accessed from the internet',
               SETTINGS_CHANGE: 'Change',
               SETTINGS_CHANGEDESC: 'The password can be changed in a new window.',
               SETTINGS_STATISTICS: 'Statistics',
               SETTINGS_STATISTICS_ENALBE: 'Anonymous statistics',
               SETTINGS_STATISTICS_ENALBEDESC: 'Please help us to improve the BierBot by agreeing on sending anonymous usage statistics. Many thanks in advance!',
               SETTINGS_UPDATE: 'Update',
               SETTINGS_UPDATEUPTODATE: 'Your BierBot runs the current firmware.',
               SETTINGS_UPDATEAVAILABLE: 'A firmware update is available for your BierBot. As soon as the automatic mode is finished the update can be installed.',
               SETTINGS_STARTUPDATE: 'To start the update please click on "Start". Do not cut the power during the process!',
               SETTINGS_SERIAL: 'Serial number',
               SETTINGS_SOFTWAREV: 'Firmware version',
               SETTINGS_HWARDWAREREV: 'Hardware revision',
               SETTINGS_BOILINGTHRESHOLD: 'Boiling threshold',
               SETTINGS_BOILINGTHRESHOLDVALIDNUMBERPLEASE: 'Please enter a valid number within the range 90-110°C.',
               SETTINGS_BOILINGTHRESHOLDDESC: 'Value in °C. If this value is exceeded the mash is considered boiling. Also, if a recipe-step has a temperature higher than the set one, the temperature is regareded "reached" as soon as above this threshold.',
               SETTINGS_ADD_TO_SENSORVAL: 'Calibration',
               SETTINGS_ADD_TO_SENSORVAL_DESC: 'This value in °C will be added to the measured temperature (negative values will be subtracted). Use this value to calibrate your temperaturesensor.',
               SETTINGS_ADD_TO_SENSORVAL_VALIDPLEASE: 'Please enter a valid number within the -5°C-5°C range.',
               SETTINGS_DEFAULTSUDSIZE: 'Standard mash size',
               SETTINGS_DEFAULTSUDSIZENUMBERPLEASE: 'Please enter a valid number.',
               SETTINGS_DEFAULTSUDSIZEDESC: 'Standard amount of mash in litres, that is the default value when starting a new sud.',
               SETTINGS_TELEGRAM_HEADER: 'Telegram notifications',
               SETTINGS_TELEGRAM_ENABLE: 'Activate Telegram notifications',
               SETTINGS_TELEGRAM_ENABLE_DESC: 'BierBot can send you notifications on Telegram, when the brew is finished or the next step requires your action.',
               SETTINGS_TELEGRAM_TOKEN: 'Token',
               SETTINGS_TELEGRAM_TOKEN_DESC: 'To use Telegram notifications you must create Telegram bot. Message @BotFather https://telegram.me/botfather to create a Telegram bot and receive a token.',
               SETTINGS_TELEGRAM_TOKEN_PLEASE: 'A token is required to use Telegram notifications.',
               SETTINGS_TELEGRAM_CHATID: 'Chat ID',
               SETTINGS_TELEGRAM_CHATID_DESC: 'The chat ID defines who notifications are sent to. Message @myidbot to request your chat ID. You may provide multiple chat IDs separated by a comma.',
               SETTINGS_TELEGRAM_CHATID_PLEASE: 'A chat ID is required to use Telegram notifications.',
               FEEDBACK: 'Feedback',
               FEEDBACK_T: 'Send feedback',
               FEEDBACK_DESC: 'You spotted an error or have a wish? We\'re glad about any suggestion. The more detaiiled, the better. If you allow us to contact you, please give your contactinformation.',
               FEEDBACK_NAME: 'Your Name',
               FEEDBACK_EMAIL: 'Email',
               FEEDBACK_TEL: 'Phone',
               FEEDBACK_FB: 'Feedback',
               FEEDBACK_TYPE: 'Type',
               FEEDBACK_TYPE_WISH: 'Wish',
               FEEDBACK_TYPE_ERROR: 'Errorreport',
               FEEDBACK_TYPY_COMMENT: 'Comment',
               UPDATE_INSTALLING: 'Update installing...',
               UPDATE_AVAILABLE: 'Update available!',
               BIERBOT_RESETTING_DESC: 'The BierBot is restarting. Please reload this page after a few minutes. The IP adress might change.',
               ALERT_FEEDBACK_SUBMIT_SUCCESS: 'Feedback sent. Muchas gracias!',
               ALERT_FEEDBACK_SUBMIT_FAILED: 'Sending feedback failed: ',
               ALERT_UPDATE_FAILED: 'Update failed',
               ALERT_HW_ADD_FAILED: 'Failed to edit or add the hardware:',
               ALERT_EDIT_FINISHED: 'Editing finished.',
               ALERT_DELETING_HW_FAILED: 'Error deleting the hardware: ',
               ALERT_DELETING_HW_SUCCESS: 'Hardware deleted',
               ALERT_SETTINGS_SAVED_SUCCESS: 'Settings saved.',
               ALERT_SETTINGS_SAVED_FAILED: 'Saving settings failed : ',
               ALERT_HARDWARE_CHOSEN_SUCCESS: 'Hardware chosen: ',
               ALERT_PROCESS_COMPLETED: 'Process successfully finished',
               ALERT_PROCESS_STARTED: 'Process started.',
               ALERT_PROCESS_STARTFAILED: 'Starting process failed: ',
               ALERT_PROCESS_ABORTED: 'Process aborted.',
               ALERT_TARGETTEMP_SET_1: 'Target temp set to ',
               ALERT_TARGETTEMP_SET_2: '°C.',
               ALERT_RECIPE_LOADED_FAILED: 'Starting failed: ',
               ALERT_RECIPE_LOADED_SUCCESS: 'Recipe successfully loaded!',
               MODAL_DELETE_HARDWARE: 'Do you really want to delete the hardware? All adaptations will be lost!',
               MODAL_RECIPE_DELETE_REALLY: 'Really delete recipe?',
               MODAL_RECIPESTEP_DELETE_REALLY: 'Really delete recipestep?',
               SOCIAL_TWITTER: 'tweet',
               SOCIAL_FACEBOOK: 'share on facebook',
               SOCIAL_GPLUS: 'share on Google+',
               LOSTCONNECTION_TITLE: 'Connection to BierBot disturbed :(',
               LOSTCONNECTION_TIME: 'Time',
               LOSTCONNECTION_STEP: 'Recipestep',
               LOSTCONNECTION_NOPANIC: 'No worries - BierBot is up and running even when you see this warning.'
            });

            $translateProvider.translations('de_DE', {
               ADD: 'Hinzufügen',
               ABORT: 'Abbruch',
               BREW: 'Brauen',
               ACTIVATE: 'Aktivieren',
               CLOSE: 'Schließen',
               COOL: 'Kühlen',
               DANGER: 'Achtung',
               DESC: 'Beschreibung',
               DUPLICATE: 'Duplizieren',
               EDIT: 'Ändern',
               EXPORT: 'Export',
               HEAT: 'Heizen',
               IMPORT: 'Import',
               IMPORTANT: 'Wichtig',
               LAN: 'LAN',
               MANUAL: 'Manuell',
               MODE: 'Modus',
               NAME: 'Name',
               NEW: 'Neu',
               NO: 'Nein',
               LOADING: 'Laden ...',
               OFF: 'Aus',
               ON: 'Ein',
               RESETTING: 'Neustarten...',
               SAVE: 'Speichern',
               SEND: 'Senden!',
               SUDNUMBER: 'Sudnummer',
               START: 'Start',
               STIRR: 'Rührwerk',
               STIRRING: 'Rühren',
               TEMPERATUREHISTORY: 'Temperaturverlauf',
               TTEMP: 'Zieltempteratur',
               TIME: 'Zeit',
               WLAN: 'WLAN',
               YES: 'Ja',
               NAV_AUTO: 'Automatik',
               NAV_MANUAL: 'Manuell',
               NAV_RECIPES: 'Rezepte',
               NAV_LOGS: 'Logs',
               NAV_SETTINGS: 'Einstellungen',
               SURE: 'Sicher?',
               WARNING: 'Warnung:',
               IDX_UPDATEAVAILALBE: 'Update verfügbar!',
               HOME_H: 'Willkommen',
               HOME_T: 'Der BierBot grüßt! Grundsätzlich werden zwei Betriebsmodi unterstützt: Automatik und manuell.',
               HOME_HMANUAL: 'Manuell',
               HOME_TMANUAL: 'Im manuellen Modus kann alles händisch geschaltet werden. Lediglich das Halten der Temperatur übernimmt der BierBot. In diesem Modus werden außerdem keine Daten geloggt',
               HOME_HAUTO: 'Automatisch',
               HOME_TAUTO: 'In diesem Modus fährt der BierBot ein vorher definiertes Rezept ab. Dieses kann entweder im "Heizen"-Modus (zum Brauen) bzw. im "Kühlungsmodus" (zum Gären) passieren. Um ein Rezept zu erzeugen, steht der Menüpunkt Rezepte zur Verfügung. In diesem Modus werden alle zur Verfügung stehenden Daten geloggt. Diese können später unter "Logs" eingesehen werden. Der detaillierte Log ist bewusst druckerfreundlich gestaltet.',
               AUTO_NOTLOADED_1: 'Momentan ist kein Rezept geladen. Um das zu ändern, bitte im Menü auf ',
               AUTO_NOTLOADED_2: 'klicken, ein Rezept mit klick auf',
               AUTO_NOTLOADED_3: 'öffnen, und den',
               AUTO_NOTLOADED_4: '-Button klicken.',
               AUTO_START: 'Start',
               AUTO_NEXT: 'Nächster Schritt',
               AUTO_LOG: 'Kommentar hinzufügen',
               AUTO_STOP: 'Stop',
               AUTO_RECIPESTARTED: 'Rezept gestartet',
               AUTO_STEPSTARTED: 'Schritt gestartet',
               AUTO_TEMPREACHED: 'Temperatur erreicht',
               AUTO_STEPFINISHED: 'Schrittende',
               AUTO_TIMEREMAINING: 'Verbleibende Zeit',
               AUTO_CURTEMP: 'Aktuelle Temperatur',
               AUTO_LOGS: 'Kommentare',
               AUTO_ABORTREALLY: 'Willst du den Vorgang wirklich abbrechen? Ein nachträgliches Wiederaufnehmen ist nicht möglich!',
               AUTO_ADDCOMMENT: 'Kommentar hinzufügen',
               AUTO_SHARE: 'Berichte deinen Freunden von deinem Sud.',
               MANUAL_WARNMOTOR: 'Um den Motor nutzen zu können, bitte erst den Warnhinweis auf der Einstellungsseite bestätigen.',
               MANUAL_ERROR_1: 'Der manuelle Modus steht nicht zur Verfügung, solange ein Rezept geladen ist. Bitte zuerst mit dem "Stop"-Button unter ',
               MANUAL_ERROR_2: 'das aktuelle Rezept beenden.',
               MANUAL_CONTROLS: 'Steuerelemente',
               MANUAL_STOPSWITCH: 'Alles aus',
               MANUAL_STOPSWITCH_BTN: 'Stop',
               RECIPES_IMPORT_BEERXML: 'BeerXML importieren',
               RECIPES_Export_BEERXML: 'BeerXML exportieren',
               RECIPES_BREW: 'Brauen',
               RECIPES_EDIT: 'Bearbeiten',
               RECIPES_ADD: 'Hinzufügen',
               RECIPES_DUPLICATE: 'Duplizieren',
               RECIPES_RECIPENAME: 'Rezeptname',
               RECIPES_DESCRIPTION: 'Beschreibung',
               RECIPES_ABORTCRITERIA: 'Abbruchkriterium',
               RECIPES_ACTIME: 'Nach bestimmter Zeit',
               RECIPES_ACMANUAL: 'Manuel weiter schalten',
               RECIPES_MODALRECIPE_EDIT: 'Rezept bearbeiten',
               RECIPES_MODALRECIPE_NAME: 'Rezeptname',
               RECIPES_MODALRECIPE_DESC: 'Beschreibung',
               RECIPES_MODALRECIPESTEP_EDIT: 'Rezeptschritt bearbeiten',
               RECIPES_MODALRECIPESTEP_NAME: 'Name',
               RECIPES_MODALRECIPESTEP_ABORTCRITERIA: 'Abbruchkriterium',
               RECIPES_MODALRECIPESTEP_TIME: 'Zeit',
               RECIPES_MODALRECIPESTEP_MANUAL: 'Manuell',
               RECIPES_MODALRECIPESTEP_HOURS: 'Stunden',
               RECIPES_MODALRECIPESTEP_MINUTES: 'Minuten',
               RECIPES_MODALRECIPESTEP_DURATION: 'Dauer',
               RECIPES_MODALRECIPESTEP_TEMP: 'Temperatur',
               RECIPES_MODALRECIPESTEP_STIRR: 'Rührwerk',
               RECIPES_IMPORT_HEADER: 'Rezepte importieren',
               RECIPES_IMPORT_BEERXML_HEADER: 'BeerXML Rezepte importieren',
               RECIPES_IMPORT_CHOSEFILE: 'Datei auswählen',
               RECIPES_IMPORT_IMPORTBTN: 'Importieren',
               LOGS_SEARCH: 'Suchen',
               LOGS_AMOUNT: 'Menge',
               LOGS_FINISHED: 'Beendet',
               LOGS_DURATION: 'Dauer',
               LOGS_MODE: 'Modus',
               LOGS_DELETE_REALLY_1: 'Willst du den Log ',
               LOGS_DELETE_REALLY_2: 'wirklich  unwiderruflich löschen?',
               LOGS_NOLOGS: 'Keine Logs vorhanden. Logs werden hier angezeigt, wenn ein Automatik-Vorgang abgeschlossen ist.',
               LOGDETAIL_BACK: 'Zurück',
               LOGDETAIL_BREWREPORT: 'Braubericht: {{name}}',
               LOGDETAIL_OVERVIEW: 'Überblick',
               LOGDETAIL_RECIPESTEPS: 'Rezeptschritte',
               LOGDETAIL_NAME: 'Name',
               LOGDETAIL_PROCESSSTARTED: 'Vorgang gestartet',
               LOGDETAIL_PROCESSFINISHED: 'Vorgang beendet',
               LOGDETAIL_DURATION: 'Dauer',
               LOGDETAIL_SUDSIZE: 'Sudgröße',
               LOGDETAIL_START: 'Start',
               LOGDETAIL_TEMPREACHED: 'Temp. erreicht',
               LOGDETAIL_DURATIONREACH: 'Dauer (Anfahren)',
               LOGDETAIL_DURATIONHOLD: 'Dauer (Halten)',
               LOGDETAIL_AVGTEMPHOLD: '{{avg}} (Halten)',
               LOGDETAIL_COMMENTS: 'Kommentare',
               LOGDETAILCSV_DOWNLOAD: 'Download',
               SETTINGS_REBOOT: 'Neustart notwendig.',
               SETTINGS_REBOOTDESC: 'Um die Änderungen wirksam zu machen, muss der BierBot neugestartet werden.',
               SETTINGS_REBOOTDESC_NOW: 'Jetz neustarten',
               SETTINGS_REBOOTDESC_LATER: 'Nicht jetzt',
               SETTINGS_LANG_H: 'Sprache',
               SETTINGS_LANG_LANG: 'Sprache auswählen',
               SETTINGS_LANG_LANGDESC: 'Hier kannst du die Sprache auswählen.',
               SETTINGS_GENERAL: 'Allgemein',
               SETTINGS_INTERFACE: 'WLAN aktivieren',
               SETTINGS_MOTORV_PRE_WRN: 'Bitte extrem aufpassen.',
               SETTINGS_MOTORV_PRE_TEXT: 'Bei allem was mir lieb ist, schwöre ich, die unten verlinkte Liste kompatibler Motoren gelesen zu haben und nicht einen nicht PWM-kompatiblen Billigmotor mit dem BierBot zu verbinden. Ich bin mir bewusst, dass unachtsames Zuwiderhandeln eine Zerstörung sowohl des BierBots als auch des Motors zur Folge haben kann.',
               SETTINGS_MOTORV_PRE_LINKTEXT: 'Liste kompatibler Motoren',
               SETTINGS_MOTORV_PRE_BTN: 'Ich habe mir den Link sorgfältig durchgelesen.',
               SETTINGS_MOTORV: 'Motorgeschwindigkeit',
               SETTINGS_MOTORVDESC: 'Wert in Volt, der es erlaubt, die Motordrehzahl individuell anzupassen. ',
               SETTINGS_MOTORVWARN: 'Prüfe unbedingt vorab, für wie viel Volt der angeschlossene Motor maximal ausgelegt ist (typischer Weise 12V oder 24V). Die hier angegebene Voltzahl dar auf keinen Fall die maximale / Betriebsvoltzahl des Motors überschreiten. Der Motor wird ansonsten dauerhaft zerstört. Der Motor darf jedoch nicht mehr wie 50W verbrauchen!',
               SETTINGS_INTERFACE_HEADER: 'Interface',
               SETTINGS_INTERFACEDESC: 'Wähle aus, wie der BierBot sich mit deinem Netzwerk verbinden soll. Achtung: Wenn du diese Option änderst, wird sich u.U. die IP des BierBots ändern. Die neue IP erfährst du u.a. über deine Router-Oberfläche. Solltest du einen Fehler bei der Eingabe des WiFi-Passworts gemacht haben, ist der BierBot nach wie vor über LAN erreichbar.',
               SETTINGS_WLANSSID: 'WLAN Name (SSID)',
               SETTINGS_WLANSSIDDESC: 'Gib hier den Namen deines WLANs ein. Dieser Name muss exakt überein stimmen.',
               SETTINGS_WLANPW: 'WLAN Passwort',
               SETTINGS_WLANPWDESC: 'Gib hier das Passwort deines WLANs ein.',
               SETTINGS_NEXTSUDNUM: 'Nächste Sudnummer',
               SETTINGS_NEXTSUDNUMDESC: 'Diese Nummer wird automatisch nach jedem Sud inkrementiert und hilft bei der Identifizierung des Datenlogs.',
               SETTINGS_RESET: 'BierBot zurücksetzen',
               SETTINGS_RESETDESC: 'Den BierBot auf den Auslieferungszustand zurück setzen. Alles außer deine gespeicherten Logs wird gelöscht.',
               SETTINGS_REBOOTMANUAL: 'BierBot neustarten',
               SETTINGS_REBOOTMANUALDESC: 'Wenn du deinen BierBot neustarten möchtest, gib einfach \"bierbot\" in das Textfeld ein und klick auf den \"neustarten\"-Button.',
               SETTINGS_REBOOTPLACEHOLDER: '\"bierbot\" eingeben',
               SETTINGS_REBOOTBTN: 'neustarten',
               SETTINGS_BIERBOTNAME: 'BierBot Name',
               SETTINGS_BIERBOTNAMEDESC: 'Hier kannst du deinem BierBot einen Namen geben, damit z. B. das Unterscheiden leichter fällt, falls du mehrere hast.',
               SETTINGS_HW: 'Hardware',
               SETTINGS_HWSETUP: 'Hardware-Setup',
               SETTINGS_HWDESC: 'Um die Steuerung bestmöglich an die Hardware anzupassen (z. B. um Überschwinger zu vermeiden), bitte hier die Hardware auswählen, die deiner Hardware am nächsten kommt.',
               SETTINGS_HWHYSTERESIS: 'Hysterese',
               SETTINGS_HWHYSTERESISDESC: 'Die Hysterese bestimmt, wie viel Grad die aktuelle Temperatur unter die Zieltemperatur fallen (steigen) darf, bevor die Heizung (Kühleung) wieder eingeschaltet wird.',
               SETTINGS_HWADDNEW: 'Neue Hardware hinzufügen',
               SETTINGS_HWEDIT: 'Hardware bearbeiten',
               SETTINGS_COMMAPLEASE: 'Bitte Kommazahl eingeben.',
               SETTINGS_VAVLIDVOLTSPLEASE: 'Bitte einen Wert zwischen 8 und 24 Volt eingeben.',
               SETTINGS_NAMEPLEASE: 'Dein BierBot würde gern einen Namen haben.',
               SETTINGS_SUDNUMPLEASE: 'Bitte eine gültige Sudnummer für dein nächstes Bier eingeben.',
               SETTINGS_HWEXPERTMODE: 'Expertenmodus',
               SETTINGS_HWEXPERTMODEDESC: 'Im Expertenmodus ist die automatische Adaption des Reglers deaktiviert und die Regelparameter können manuell (grenzenlos) festgelegt werden. Instabilität (Aufschwingen) bzw. ein extremes Überschwingen können die Folge sein. Verwenden Sie diese Einstellung nur, wenn Sie mit der Funktionsweise eines PD-Reglers vertraut sind.',
               SETTINGS_PLEASEUSEEXPERTMODE: 'Um PD-Regler manuell zu kalibrieren, nutzen Sie bitte den Expertenmodus',
               SETTINGS_HWKPDESC: 'Regelt den Einfluss des P-Gliedes auf den Regler. Höhrere Werte bedeuten eine stärkere Berücksichtung der aktuellen Temperatur.',
               SETTINGS_HWKDDESC: 'Regelt den Einfluss des D-Gliedes auf den Regler. Höhere Werte bedeuten eine stärkere Berücksichtigung der aktuellen Temperaturänderung.',
               SETTINGS_DATE: 'Uhrzeit und Datum',
               SETTINGS_DATEMANUAL: 'Manuelle Uhrzeit',
               SETTINGS_DATEMANUALDESC: 'Falls dein BierBot keinen Zugang zum Internet hat, kannst du Uhrzeit und Datum auch manuell setzen.',
               SETTINGS_CLOCK: 'Uhrzeit',
               SETTINGS_PW: 'Passwort',
               SETTINGS_PWPROTECT: 'Passwortschutz',
               SETTINGS_PWDESC: 'Um den BierBot vor unbefugtem Zugriff zu schützen (z. B. wenn er über das Internet erreichbar ist), kannst du hier den Passwortschutz aktivieren',
               SETTINGS_CHANGE: 'Ändern',
               SETTINGS_CHANGEDESC: 'Zum Ändern des Passworts öffnet sich ein neues Fenster.',
               SETTINGS_STATISTICS: 'Statistiken',
               SETTINGS_STATISTICS_ENALBE: 'Anonyme Statistik',
               SETTINGS_STATISTICS_ENALBEDESC: 'Hilf uns den BierBot weiterzuentwickeln, indem du der Übertragung anonymer Nutzungsstatistiken zustimmst. Herzlichen Dank im Voraus!',
               SETTINGS_UPDATE: 'Update',
               SETTINGS_UPDATEUPTODATE: 'Dein BierBot ist auf dem aktuellen Stand ',
               SETTINGS_UPDATEAVAILABLE: 'Für deinen Bierbot steht ein Update zur Verfügung. Sobald der Automatik-Modus nicht mehr aktiv ist, kann dieses installiert werden.',
               SETTINGS_STARTUPDATE: 'Um das Update zu starten, bitte auf "Starten" klicken. Trenne auf keinen Fall während des Updates die Stromverbindung!',
               SETTINGS_SERIAL: 'Seriennummer',
               SETTINGS_SOFTWAREV: 'Firmware-Version',
               SETTINGS_HWARDWAREREV: 'Hardware-Revision',
               SETTINGS_BOILINGTHRESHOLD: 'Kochschwelle',
               SETTINGS_BOILINGTHRESHOLDVALIDNUMBERPLEASE: 'Bitte gültige Zahl im Bereich 90-110°C eingeben.',
               SETTINGS_BOILINGTHRESHOLDDESC: 'Wert in °C, ab wann der Sud als kochend gilt. Die Zieltempteratur des jeweiligen Rezeptschrittes gilt als erreicht, sobald diese Temperatur überschritten wird',
               SETTINGS_ADD_TO_SENSORVAL: 'Kalibrierung',
               SETTINGS_ADD_TO_SENSORVAL_DESC: 'Dieser Wert in °C wird auf den gemessenen Temperaturwert addiert (negative Werte werden abgezogen). So kannst du deinen BierBot kalibrieren.',
               SETTINGS_ADD_TO_SENSORVAL_VALIDPLEASE: 'Bitte gib eine gültige Nummer im Bereich -5°C-5°C ein.',
               SETTINGS_DEFAULTSUDSIZE: 'Standard-Sudgröße',
               SETTINGS_DEFAULTSUDSIZENUMBERPLEASE: 'Bitte gültige Zahl eingeben.',
               SETTINGS_DEFAULTSUDSIZEDESC: 'Sudgröße in Litern (l), die standardmäßig beim Starten eines neuen Sudes verwendet wird.',
               SETTINGS_TELEGRAM_HEADER: 'Telegram-Benachrichtigungen',
               SETTINGS_TELEGRAM_ENABLE: 'Benachrichtigungen aktivieren',
               SETTINGS_TELEGRAM_ENABLE_DESC: 'BierBot kann dir Benachrichtigungen an Telegram schicken, wenn der Brauvorgang abgeschlossen ist oder der nächste Schritt dein Eingreifen erfordert.',
               SETTINGS_TELEGRAM_TOKEN: 'Token',
               SETTINGS_TELEGRAM_TOKEN_DESC: 'Um Telegram-Benachrichtigungen nutzen zu können, musst du einen Telegram Bot erstellen. Schreibe @BotFather, um einen Telegram Bot zu erstellen und einen Token zu erhalten.',
               SETTINGS_TELEGRAM_TOKEN_PLEASE: 'Ein Token ist notwendig, um Telegram-Benachrichtigungen nutzen zu können.',
               SETTINGS_TELEGRAM_CHATID: 'Chat-ID',
               SETTINGS_TELEGRAM_CHATID_DESC: 'Mit der Chat-ID gibst du an, an wen Benachrichtigungen geschickt werden sollen. Schreibe @myidbot, um deine Chat-ID herauszufinden. Du kannst auch mehrere Chat-IDs angeben, indem du sie mit einem Komma trennst.',
               SETTINGS_TELEGRAM_CHATID_PLEASE: 'Eine Chat-ID ist notwendig, um Telegram-Benachrichtigungen nutzen zu können.',
               FEEDBACK: 'Feedback',
               FEEDBACK_T: 'Feedback senden',
               FEEDBACK_DESC: 'Sie haben einen Fehler entdeckt und/oder einen Wunsch? Wir freuen uns über jede Anregung. Je ausführlicher, desto besser. Wenn wir Sie kontaktieren dürfen, können Sie außerdem ihre Kontaktdetails hinterlegen',
               FEEDBACK_NAME: 'Dein Name',
               FEEDBACK_EMAIL: 'Email',
               FEEDBACK_TEL: 'Telefon',
               FEEDBACK_FB: 'Feedback',
               FEEDBACK_TYPE: 'Typ',
               FEEDBACK_TYPE_WISH: 'Anregung/Wunsch',
               FEEDBACK_TYPE_ERROR: 'Fehlermeldung',
               FEEDBACK_TYPY_COMMENT: 'Kommentar',
               UPDATE_INSTALLING: 'Update wird installiert...',
               UPDATE_AVAILABLE: 'Update verfügbar!',
               BIERBOT_RESETTING_DESC: 'Der BierBot wird neu gestartet. Bitte aktualisieren Sie diese Seite. Die IP-Adresse kann sich unter Umständen dadurch ändern.',
               ALERT_FEEDBACK_SUBMIT_SUCCESS: 'Feedback übermittelt. Vielen Dank!',
               ALERT_FEEDBACK_SUBMIT_FAILED: 'Übermittlung des Feedbacks fehlgeschlagen: ',
               ALERT_UPDATE_FAILED: 'Update fehlgeschlagen',
               ALERT_HW_ADD_FAILED: 'Fehler beim Hinzufügen/Ändern der Hwardware:',
               ALERT_EDIT_FINISHED: 'Bearbeitung abgeschlossen.',
               ALERT_DELETING_HW_FAILED: 'Fehler beim Löschen der Hardware: ',
               ALERT_DELETING_HW_SUCCESS: 'Hardware gelöscht',
               ALERT_SETTINGS_SAVED_SUCCESS: 'Einstellungen gespeichert.',
               ALERT_SETTINGS_SAVED_FAILED: 'Einstellungen speicher fehlgeschlagen - ',
               ALERT_HARDWARE_CHOSEN_SUCCESS: 'Hardware ausgewählt: ',
               ALERT_PROCESS_COMPLETED: 'Vorgang erfolgreich abgeschlosen',
               ALERT_PROCESS_STARTED: 'Brauvorgang gestartet.',
               ALERT_PROCESS_STARTFAILED: 'Starten des Brauvorgangs fehlgeschlagen: ',
               ALERT_PROCESS_ABORTED: 'Brauvorgang abgebrochen.',
               ALERT_TARGETTEMP_SET_1: 'Zieltempteratur auf ',
               ALERT_TARGETTEMP_SET_2: '°C gesetzt.',
               ALERT_RECIPE_LOADED_FAILED: 'Starten fehlgeschlagen: ',
               ALERT_RECIPE_LOADED_SUCCESS: 'Rezept erfolgreich geladen!',
               MODAL_DELETE_HARDWARE: 'Wollen Sie die Hardware wirklich löschen? Alle Adaptierungen gehen dann verloren!',
               MODAL_RECIPE_DELETE_REALLY: 'Rezept wirklich löschen?',
               MODAL_RECIPESTEP_DELETE_REALLY: 'Schritt wirklich löschen?',
               SOCIAL_TWITTER: 'twittern',
               SOCIAL_FACEBOOK: 'Auf facebook teilen',
               SOCIAL_GPLUS: 'Auf Google+ teilen',
               LOSTCONNECTION_TITLE: 'Verbindung zum BierBot unterbrochen :(',
               LOSTCONNECTION_TIME: 'Zeit',
               LOSTCONNECTION_STEP: 'Rezeptschritt',
               LOSTCONNECTION_NOPANIC: 'Keine Sorge - der BierBot arbeitet auch während der Unterbrechung weiter.'
            });

            // Nicht vergessen: die Standardsprache
            //$translateProvider.determinePreferredLanguage();
            $translateProvider.preferredLanguage('de_DE');
            $translateProvider.useSanitizeValueStrategy('escaped');

            // analytics
            AnalyticsProvider
               .setAccount('UA-159945112-1')
               .startOffline(true);
         } catch (ex) {
            console.error("exception: error configuring app: ", ex);
         }
      }
   ]);

   App.run(['Analytics', function(Analytics) {}]);

   App.controller("BrewNavController", ["$scope", "$rootScope", function($scope, $rootScope) {
      try {
         $scope.selected = 0;

         $scope.isSelected = function(checkPartial) {
            return $scope.selected == checkPartial;
         };

         $scope.select = function(setPartial) {
            $scope.selected = setPartial;
         };

         $rootScope.$on('rootScope:selectPartial', function(event, num) {
            $scope.selected = num;
         });
      } catch (ex) {
         console.error("exception: error in BrewNavController: ", ex);
      }
   }]);


   // date1 is the date longer ago
   // display Seconds being bool
   var getTimeDiff = function(date1, date2, displaySeconds) {
      try {
         date2 = new Date(date2);
         date1 = new Date(date1);
         var diffInMs = date2.getTime() - date1.getTime();
         var retString = '';

         if (diffInMs > 0) {

            var days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
            diffInMs -= days * (1000 * 60 * 60 * 24);

            var hours = Math.floor(diffInMs / (1000 * 60 * 60));
            diffInMs -= hours * (1000 * 60 * 60);

            var mins = Math.floor(diffInMs / (1000 * 60));
            diffInMs -= mins * (1000 * 60);

            var seconds = Math.floor(diffInMs / (1000));
            diffInMs -= seconds * (1000);

            if (days > 0) {
               retString = days + 'd ';
            }


            retString += ("0" + hours).slice(-2) + ':' + ("0" + mins).slice(-2);

            if (displaySeconds == true) {
               retString += ':' + ("0" + seconds).slice(-2);
            }
            retString += 'h';
         }

         return retString;
      } catch (ex) {
         console.error("exception: error getting time difference: ", ex);
      }
   };

   var getTimeDiffMinutes = function(date1, date2) {
      try {
         date2 = new Date(date2);
         date1 = new Date(date1);
         var diffInMs = date2.getTime() - date1.getTime();
         var retString = '';

         if (diffInMs > 0) {

            return diffInMs / 1000 / 60;
         }

         return 0;
      } catch (ex) {
         console.error("exception: error getTimeDiffMinutes: ", ex);
      }
   };

   App.controller('ChartControllerDetail', ["$rootScope", "$scope", "Socket", function($rootScope, $scope, Socket) {
      try {
         $scope.mode = 'heat';

         $scope.xAxisTickFormatFunction = function() {

            if ($scope.mode == 'heat') {
               return function(d) {
                  if (typeof d == 'undefined') {
                     return 0;
                  }
                  return d3.time.format('%H:%M:%S')(new Date(d)); //uncomment for date format
               };
            } else {
               return function(d) {
                  if (typeof d == 'undefined') {
                     return 0;
                  }
                  return d3.time.format('%_d.%m.%y, %H:%M')(new Date(d)); //uncomment for date format
               };
            }
         };

         $rootScope.$on('rootScope:initDetailChart', function(event, data) {

            try {
               $scope.chartData = [{
                     "key": "Temperature",
                     "values": [] // e.g. [ [ x , y] , [ 1 , 2] , [ 2 , 3] , [ 3 , 2] ]
                  },
                  {
                     "key": "Schritt",
                     "values": [] // e.g. [ [ x , y] , [ 1 , 2] , [ 2 , 3] , [ 3 , 2] ]
                  }
               ];

               var minTemp = 0;
               var maxTemp = 10;


               if ((typeof data != 'undefined') && (typeof data.temperature != 'undefined')) {

                  data.temperature.forEach(function(elem, idx, array) {

                     var startTime = new Date(elem[0]); // elem[0] is ISO string
                     startTime = startTime.getTime(); // - ( startTime.getTimezoneOffset() * 60 * 1000 ) ;

                     var value = elem[1];

                     addTempToPlotDetail(value, startTime);

                     if (value < minTemp) minTemp = value;
                     if (value > maxTemp) maxTemp = value;
                  });
               }

               if (typeof data.step != 'undefined') {
                  data.step.forEach(function(elem, idx, array) {

                     var startTime = new Date(elem[0]); // elem[0] is ISO string
                     startTime = startTime.getTime(); // - ( startTime.getTimezoneOffset() * 60 * 1000 ) ;

                     addStepToPlotDetail(elem[1], startTime, minTemp, maxTemp);
                  });
               }
            } catch (ex) {
               console.error("exception: error 64ad8936e093430680bbc141f19e7a87", ex);
            }
         });

         $scope.updateEveryNValue = function() {
            Socket.emit('getSettings', {
               data: 'not used'
            }, function(err, response) {
               if (!err) {
                  if ($scope.mode == 'heat') {
                     // take every 10th value (10s)
                     $scope.everyNValue = response.settings.logEveryXsTempValToDBHeat;
                  } else if ($scope.mode == 'cool') {
                     // take every 300th value (300s = 5min)
                     $scope.everyNValue = response.settings.logEveryXsTempValToDBCool;

                  }
               }
            });
         };

         $scope.updateEveryNValue();
         $scope.everyNValueCount = $scope.everyNValue;

         $rootScope.$on('rootScope:detailChartModeChange', function(event, newMode) {
            $scope.mode = newMode;
            $scope.updateEveryNValue();

         });



         // if timestamp is null, current timestamp will be used
         var addTempToPlotDetail = function(temp, timestamp) {
            var dateToUse = Date.now();
            if (timestamp)
               dateToUse = timestamp; // use timestamp if set

            try {
               $scope.chartData[chartDataStepIdx].values.push([dateToUse, temp]);
            } catch (ex) {
               console.error("exception: error e586ca70bf874f08813a3db7da1055b7", ex);
            }

            //dont filter in this case
         };



         // if timestamp is null, current timestamp will be used
         var addStepToPlotDetail = function(step, timestamp, minTemp, maxTemp) {
            var dateToUse = Date.now();
            if (timestamp)
               dateToUse = timestamp; // use timestamp if set


            $scope.chartData.push({
               key: 'Schritt ' + step,
               values: [
                  [dateToUse, minTemp],
                  [dateToUse, maxTemp]
               ]
            });

            //[chartDataTempIdx].values.push([dateToUse , step]);

            //dont filter in this case
         };
      } catch (ex) {
         console.error("exception: error in ChartControllerDetail: ", ex);
      }
   }]);

   // Chart controller used for displaying in auto mode
   App.controller('ChartController', ["$rootScope", "$scope", "Socket", function($rootScope, $scope, Socket) {
      try {
         $scope.mode = 'heat';
         $scope.everyNValueCount = 0;
         $scope.addToSensorVal = 0;

         $scope.chartData = [{
            "key": "Temperature",
            "values": [] // e.g. [ [ x , y] , [ 1 , 2] , [ 2 , 3] , [ 3 , 2] ]
         }];

         $scope.xAxisTickFormatFunction = function() {

            if ($scope.mode == 'heat') {
               return function(d) {
                  if (typeof d == 'undefined') {
                     return 0;
                  }
                  return d3.time.format('%H:%M:%S')(new Date(d)); //uncomment for date format
               };
            } else {
               return function(d) {
                  if (typeof d == 'undefined') {
                     return 0;
                  }
                  return d3.time.format('%_d.%m.%y, %H:%M')(new Date(d)); //uncomment for date format
               };
            }
         };


         $rootScope.$on('rootScope:initChart', function(event, data) {
            $scope.chartData[chartDataTempIdx] = {
               "key": "Temperature",
               "values": []
            };


            if ((typeof data != 'undefined') && (typeof data.temperature != 'undefined')) {
               data.temperature.forEach(function(elem, idx, array) {

                  var startTime = new Date(elem[0]); // elem[0] is ISO string
                  startTime = startTime.getTime(); // - ( startTime.getTimezoneOffset() * 60 * 1000 ) ;

                  addTempToPlot(elem[1], startTime);
                  //$scope.chartData[chartDataTempIdx].values.push()
               });
            }
         });


         $rootScope.$on('rootScope:physicsUpdate', function(event, physicsData) {
            var tempCalibrated = physicsData.firstTemp + $scope.addToSensorVal;
            $scope.temp1 = tempCalibrated;


            if ($scope.targetTemperature == null) {
               $scope.targetTemperature = Math.round(tempCalibrated);
            }
         });

         // if timestamp is null, current timestamp will be used
         var addTempToPlot = function(temp, timestamp) {
            try {
               var dateToUse = Date.now();
               if (timestamp)
                  dateToUse = timestamp; // use timestamp if set

               $scope.chartData[chartDataTempIdx].values.push([dateToUse, temp]);
               $scope.everyNValueCount = 0;

               // filter
               var arrayLen = $scope.chartData[0].values.length;
               if ($scope.mode == 'heat') {
                  // only use last 60 minutes, one element every 10s
                  // => 6 per minute * 60 minutes = 360 points
                  var lim = -360;
                  if ($scope.chartData[0].values.length < (lim * -1)) {
                     lim = (-1) * $scope.chartData[0].values.length;
                  }
                  $scope.chartData[0].values = $scope.chartData[0].values.splice(lim, arrayLen);
               } else if ($scope.mode == 'cool') {
                  // only use last 2 days, one element every 5min
                  // => 20 per hour * 24 hours * 2 days = 960 points
                  var lim = -960;
                  if ($scope.chartData[0].values.length < (lim * -1)) {
                     lim = (-1) * $scope.chartData[0].values.length;
                  }
                  $scope.chartData[0].values = $scope.chartData[0].values.splice(lim, arrayLen);

               }
            } catch (ex) {
               console.error("exception: error d0993c8434e0411caad419249805959e", ex);
            }
         };

         $rootScope.$on('rootScope:physicsUpdate', function(event, physicsData) {
            try {
               if ($scope.everyNValueCount >= $scope.everyNValue) {
                  //window.alert('$scope.everyNValueCount: ' + $scope.everyNValueCount + ', $scope.everyNValue:' + $scope.everyNValue);
                  addTempToPlot(physicsData.firstTemp, null);
               }

               // check if undefined, addition would result in NaN
               if ($scope.everyNValueCount != undefined) {
                  $scope.everyNValueCount = $scope.everyNValueCount + 1;
               }
            } catch (ex) {
               console.error("exception: error fe36348326214db1966ccbb8631d1fbb", ex);
            }
         });

         $scope.updateEveryNValue = function() {
            Socket.emit('getSettings', {
               data: 'not used'
            }, function(err, response) {
               if (!err) {
                  if ($scope.mode == 'heat') {
                     // take every 10th value (10s)
                     $scope.everyNValue = response.settings.logEveryXsTempValToDBHeat;
                  } else if ($scope.mode == 'cool') {
                     // take every 300th value (300s = 5min)
                     $scope.everyNValue = response.settings.logEveryXsTempValToDBCool;

                  }
                  $scope.everyNValueCount = $scope.everyNValue;
                  $scope.addToSensorVal = response.settings.addToSensorVal;
               }
            });
         };

         $scope.updateEveryNValue();

         $rootScope.$on('rootScope:modeChange', function(event, newMode) {
            $scope.mode = newMode;
            $scope.updateEveryNValue();
         });
      } catch (ex) {
         console.error("exception: error ChartController: ", ex);
      }
   }]);

   App.controller('MainController', ["$rootScope", "$scope", "Socket", "$translate", "$location", "Analytics",
      function($rootScope, $scope, Socket, $translate, $location, Analytics) {
         try {
            $scope.bierBotName = 'BierBot';
            $scope.updateAvailable = false;
            $scope.wifiSignal = null;
            $scope.controlStateInitialized = false;
            $scope.physicsInitialized = false;

            Socket.emit('getSettings', {
               data: 'not used'
            }, function(err, response) {
               if (!err) {
                  if (response['settings']) {
                     $scope.bierBotName = response.settings.bierBotName;
                     $scope.dataReceived = true;
                     $scope.updateAvailable = response.settings.updateAvailable;

                     var key = response.settings.languageKey;
                     $translate.use(key).then(function(key) {
                        console.log('changed language to ' + key);
                     }, function(key) {
                        console.log('something went wrong.');
                     });

                     if (response.settings.sendStatistics) {
                        console.log('enabling stats.');
                        Analytics.offline(false);
                     } else {
                        console.log('disabling stats in case enabled.');
                        Analytics.offline(true);
                     }

                     if (response.settings.updateInProgress == true) {
                        $('#updateInstallDlg').modal('show');
                     }

                  }
               }
            });

            $scope.beepLongShort = function() {
               var audio = new Audio('/secure/media/plop.mp3');
               audio.play();
            };

            $scope.beepLongLongLong = function() {
               var audio = new Audio('/secure/media/plop.mp3');
               audio.play();
            };


            Socket.on('newStepSet', function(data) {
               var step = data.step;

               if (step.endStepBy == "never") {
                  $scope.beepLongLongLong();
               } else {
                  $scope.beepLongShort();
               }

            });

            Socket.emit('getControlState', {
               data: 'not used'
            }, function(err, controlState) {
               if (!err) {
                  $scope.mode = controlState.mode;
                  $scope.controlStateInitialized = true;
               }
            });

            $rootScope.$on('rootScope:modeChange', function(event, newMode) {
               $scope.mode = newMode;
            });

            var setWifiSignalStrength = function() {

               Socket.emit('getWifiSignalStrength', {
                  data: 'not used'
               }, function(err, signal) {
                  if (!err) {
                     console.log("wifi strength: " + signal);
                     if (signal > 70) {
                        $scope.wifiSignal = 4;
                     } else if (signal > 40) {
                        $scope.wifiSignal = 3;
                     } else if (signal > 10) {
                        $scope.wifiSignal = 2;
                     } else if (signal > 0) {
                        $scope.wifiSignal = 1;
                     } else if (signal == 0) {
                        $scope.wifiSignal = 0;
                     } else {
                        $scope.wifiSignal = null;
                     }

                     var mutliplicator = 0;
                     if ($scope.wifiSignal != null) {
                        mutliplicator = $scope.wifiSignal;
                     }

                     $scope.signalStyle = {
                        'width': (3 * mutliplicator) + "px"
                     };
                  }
               });
            };

            // call once and setup intervall
            setWifiSignalStrength();
            var wifiIntervallID = setInterval(function() {
               setWifiSignalStrength();
            }, 10000);

            $rootScope.$on('rootScope:settingsUpdated', function(event, settings) {
               $scope.bierBotName = settings.bierBotName;
            });

            // incoming sockets
            Socket.on('physicUpdate', function(data) {
               $scope.temp1 = data.firstTemp;
               $scope.stirr = data.stirr;
               $scope.heatingCooling = data.heatingCooling;
               $rootScope.$broadcast('rootScope:physicsUpdate', data);
               $scope.physicsInitialized = true;
            });

            Socket.on('startingUpdate', function(err) {
               $('#updateInstallDlg').modal('show');
            });

            Socket.on('updateFinished', function(err) {
               if (err) {
                  $('#updateInstallDlg').modal('hide');
                  $translate('ALERT_UPDATE_FAILED').then(function(txt) {
                     $rootScope.$broadcast('rootScope:showAlert', {
                        type: 'err',
                        text: txt + err
                     });
                  });
               } else {
                  $('#updateInstallDlg').modal('hide');
                  $('#resettingDlg').modal('show');
               }
            });
         } catch (ex) {
            console.error("exception: error MainController: ", ex);
         }
      }
   ]);

   App.controller('TimepickerCtrl', ["$scope", "$rootScope", "$log", function($scope, $rootScope, $log) {
      try {
         $scope.mytime = new Date();

         $scope.hstep = 1;
         $scope.mstep = 1;

         // $scope.options = {
         //   hstep: [1, 2, 3],
         //   mstep: [1, 5, 10, 15, 25, 30]
         // };

         $scope.ismeridian = false;
         //  $scope.toggleMode = function() {
         //    $scope.ismeridian = ! $scope.ismeridian;
         //  };

         $scope.update = function() {
            var d = new Date();
            d.setHours(14);
            d.setMinutes(0);
            $scope.mytime = d;
         };

         $scope.changed = function() {
            $log.log('Time changed to: ' + $scope.mytime);
            $rootScope.$broadcast('rootScope:timeChanged', $scope.mytime);
         };

         $scope.clear = function() {
            $scope.mytime = null;
         };
      } catch (ex) {
         console.error("exception: error TimepickerCtrl", ex);
      }
   }]);

   App.controller('DatepickerCtrl', ["$scope", "$rootScope", "$log", function($scope, $rootScope, $log) {

      try {
         $scope.today = function() {
            $scope.dt = new Date();
         };
         $scope.today();

         $scope.clear = function() {
            $scope.dt = null;
         };

         // Disable weekend selection
         // $scope.disabled = function(date, mode) {
         // return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
         // };

         $scope.toggleMin = function() {
            $scope.minDate = $scope.minDate ? null : new Date();
         };
         $scope.toggleMin();

         $scope.open = function($event) {
            $scope.status.opened = true;
         };

         $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
         };

         $scope.formats = ['dd.MM.yyyy', 'yyyy/MM/dd', 'dd-MMMM-yyyy', 'shortDate'];
         $scope.format = $scope.formats[0];

         $scope.status = {
            opened: false
         };


         $scope.$watch('dt', function() {
            $log.log('date changed to: ' + $scope.dt);
            $rootScope.$broadcast('rootScope:dateChanged', $scope.dt);
         });

         var tomorrow = new Date();
         tomorrow.setDate(tomorrow.getDate() + 1);
         var afterTomorrow = new Date();
         afterTomorrow.setDate(tomorrow.getDate() + 2);
         $rootScope.events = [{
               date: tomorrow,
               status: 'full'
            },
            {
               date: afterTomorrow,
               status: 'partially'
            }
         ];

         $scope.$watch('dt', function() {
            $rootScope.$broadcast('rootScope:dateChanged', $scope.dt);
         });

         $scope.getDayClass = function(date, mode) {
            if (mode === 'day') {
               var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

               for (var i = 0; i < $scope.events.length; i++) {
                  var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);

                  if (dayToCheck === currentDay) {
                     return $scope.events[i].status;
                  }
               }
            }
            return '';
         };
      } catch (ex) {
         console.error("exception: error DatepickerCtrl:" + ex);
      }
   }]);

   // settings controller
   App.controller('SettingsController', ["$rootScope", "$scope", "Socket", "$translate", function($rootScope, $scope, Socket, $translate) {
      try {
         $scope.settings = null;
         $scope.hardwares = null;
         $scope.selectedHardware = null;
         $scope.editedHardware = null;
         $scope.dataReceived = false;
         $scope.pendingChanges = false;
         $scope.alertMessage = "";
         $scope.deleteAllowed = false;

         $scope.supportedLanguages = [{
               key: 'de_DE',
               name: 'Deutsch'
            },
            {
               key: 'en_US',
               name: 'English'
            }
         ];

         var updateWifiList = function(receivedNetworks) {
            if ($scope.settings.wlanSSID != null) {
               //$scope.networks = [{ssid: $scope.settings.wlanSSID, signal: 0}];
               $scope.networks = [$scope.settings.wlanSSID];
               $scope.settings.wlanSSID = $scope.networks[0];
            }

            if (typeof receivedNetworks != 'undefined' && receivedNetworks != null) {
               receivedNetworks.forEach(function(elem, idx, array) {

                  if (elem.ssid == $scope.settings.wlanSSID) {
                     //$scope.networks[0].signal = elem.signal;
                  } else {
                     //$scope.networks.push({ssid: elem.ssid, signal: elem.signal});
                     $scope.networks.push(elem.ssid);
                  }
               });
            }

            $scope.scanningForWifi = false;
         };

         $('#pleaseWaitDialog').modal('show');
         Socket.emit('reportTab', 'settings');
         $rootScope.$broadcast('rootScope:selectPartial', 5);

         Socket.emit('getSettings', {
            data: 'not used'
         }, function(err, response) {
            if (!err) {
               if (response['settings']) {
                  $scope.settings = response.settings;
                  $scope.hardwares = response.hardware;
                  $scope.hardwares.forEach(function(hw, idx, array) {
                     if (hw._id === $scope.settings.selectedHardware) {
                        $scope.selectedHardware = hw;
                     }
                  });
                  $scope.bierBotState = response.bierBotState;
                  $scope.oldWifiSetting = response.settings.wifiEnabled;
                  $('#pleaseWaitDialog').modal('hide');
                  $scope.dataReceived = true;

                  updateWifiList(response.bierBotState.networks);
               }
            }
         });

         $scope.scanningForWifi = true;
         $scope.updateWifiList = function() {
            $scope.scanningForWifi = true;
            Socket.emit('getWifiList', {
               data: 'not used'
            }, function(err, response) {
               if (!err) {
                  if (response['networks'] != false) {
                     updateWifiList(response['networks']);
                  }
               }
            });
         };

         //$scope.languageKey = $translate.use();

         $scope.changeLanguage = function() {
            var key = $scope.settings.languageKey;
            $translate.use(key).then(function(key) {
               console.log('changed language to ' + key + '.');
            }, function(key) {
               console.log('something went wrong changing the language.');
            });
         };



         $rootScope.$on('rootScope:timeChanged', function(event, newTime) {
            if ($scope.settings != null) {
               if ($scope.settings.manualTime == null ||
                  !($scope.settings.manualTime instanceof Date)) {
                  $scope.settings.manualTime = new Date();
               }

               $scope.settings.manualTime.setHours(newTime.getHours());
               $scope.settings.manualTime.setMinutes(newTime.getMinutes());
            }
         });

         $rootScope.$on('rootScope:dateChanged', function(event, newDate) {
            if ($scope.settings != null) {
               if ($scope.settings.manualTime == null ||
                  !($scope.settings.manualTime instanceof Date)) {
                  $scope.settings.manualTime = new Date();
               }
               $scope.settings.manualTime.setDate(newDate.getDate());
               $scope.settings.manualTime.setMonth(newDate.getMonth());
               $scope.settings.manualTime.setFullYear(newDate.getFullYear());
            }
         });

         $scope.selectValueChanged = function() {

         };

         $scope.setAlertMessage = function(speachID) {

            $translate(speachID).then(function(txt) {
               $scope.alertMessage = txt;
            });
         };
         $scope.setWindowTitle = function(speachID) {

            $translate(speachID).then(function(txt) {
               $scope.windowTitle = txt;
            });
         };

         $scope.editHardware = function(hardware) {

            if (hardware == null) {
               // create new hardware
               hardware = {
                  description: {
                     "enen": "",
                     "dede": ""
                  },
                  name: "",
                  pd: {
                     "kp": 1,
                     "kd": 1,
                     "hysteresis": 1
                  }
               };
               $scope.editedHardware = hardware;
            } else {
               // edit existing
               $scope.editedHardware = angular.copy($scope.selectedHardware);
            }
         };
         $scope.finishEdit = function() {
            Socket.emit('upsertHardware', $scope.editedHardware, function(err, newHardware) {
               if (err) {
                  $translate('ALERT_HW_ADD_FAILED').then(function(txt) {
                     $rootScope.$broadcast('rootScope:showAlert', {
                        type: 'err',
                        text: txt + err
                     });

                  });
               } else {
                  // remove old entry
                  $scope.hardwares.forEach(function(hw, idx, array) {
                     // delete old one
                     if (hw._id == newHardware._id) {
                        array.splice(idx, 1);
                     }
                  });

                  // add and select new one
                  $scope.hardwares.push(newHardware);
                  $scope.selectedHardware = newHardware;
                  $translate('ALERT_EDIT_FINISHED').then(function(txt) {
                     $rootScope.$broadcast('rootScope:showAlert', {
                        type: 'success',
                        text: txt
                     });
                  });
               }
            });
         };

         $scope.deleteHardware = function() {
            Socket.emit('deleteHardware', $scope.selectedHardware, function(err, newSelectedId) {
               if (err) {
                  $translate('ALERT_DELETING_HW_FAILED').then(function(txt) {
                     $rootScope.$broadcast('rootScope:showAlert', {
                        type: 'err',
                        text: txt + err
                     });

                  });
               } else {
                  $translate('ALERT_DELETING_HW_SUCCESS').then(function(txt) {
                     $rootScope.$broadcast('rootScope:showAlert', {
                        type: 'success',
                        text: txt
                     });
                  });

                  $scope.hardwares.forEach(function(hw, idx, array) {
                     // delete old one
                     if (hw._id == $scope.selectedHardware._id) {
                        array.splice(idx, 1);
                     }
                  });
                  $scope.hardwares.forEach(function(hw, idx, array) {
                     // select new one
                     if (hw._id === newSelectedId) {
                        $scope.selectedHardware = hw;
                     }
                  });
               }
            });
         };

         $scope.cancelEdit = function() {
            $scope.editedHardware = null;
         };

         $scope.startUpdate = function() {

            Socket.emit('installUpdate', {
               data: 'not used'
            }, function(err) {});
         };

         $scope.requestReboot = function() {
            Socket.emit('requestReboot', {
               data: 'not used'
            }, function(err, response) {
               if (!err) {
                  $('#resettingDlg').modal('show');
               }
            });
         };

         $scope.saveSettings = function() {
            $scope.settings.selectedHardware = $scope.selectedHardware._id;
            Socket.emit('updateSettings', {
               settings: $scope.settings,
               hardware: $scope.selectedHardware
            }, function(err, response) {
               if (!err) {
                  $translate('ALERT_SETTINGS_SAVED_SUCCESS').then(function(txt) {
                     $rootScope.$broadcast('rootScope:showAlert', {
                        type: 'success',
                        text: txt
                     });
                  });
                  $rootScope.$broadcast('rootScope:settingsUpdated', response.settings);
                  $scope.pendingChanges = false;


                  //if ($scope.oldWifiSetting != $scope.settings.wifiEnabled)
                  //{
                  //    $('#modalReboot').modal('show');
                  //}

               } else {
                  $translate('ALERT_SETTINGS_SAVED_FAILED').then(function(txt) {
                     $rootScope.$broadcast('rootScope:showAlert', {
                        type: 'err',
                        text: txt + err
                     });
                  });
               }
            });
         };
      } catch (ex) {
         console.error("exception: error SettingsController", ex);
      }
   }]);

   App.controller('AutomaticController', ["$rootScope", "$scope", "Socket", "$translate", function($rootScope, $scope, Socket, $translate) {

      try {
         $scope.recipe = brew;
         $scope.currentStep = null;
         $scope.remainingTime = "-";
         $scope.stepEstFinish = "-";
         $scope.loaeded = false;
         $scope.CperMin = 0;
         $scope.estimated = true; // end and reached time are estimated
         $scope.selectedHardware = null;
         $scope.hardwares = null;

         $rootScope.$broadcast('rootScope:selectPartial', 1);

         $('#pleaseWaitDialog').modal('show');

         Socket.emit('reportTab', "auto");

         Socket.emit('getSettings', {
            data: 'not used'
         }, function(err, response) {
            if (!err) {
               if (response['settings']) {}
            }
         });

         Socket.emit('getCurrentBrew', {
            nodata: true
         }, function(err, currentBrew) {
            if (!err) {
               brew = currentBrew;
               $rootScope.$broadcast('rootScope:RecipeLoaded');

               $rootScope.$broadcast('rootScope:modeChange', currentBrew.mode);

            }


            Socket.emit('getSettings', {
               data: 'not used'
            }, function(err, response) {
               if (!err) {
                  if (response['settings']) {
                     $scope.settings = response.settings;
                     $scope.hardwares = response.hardware;
                     $scope.hardwares.forEach(function(hw, idx, array) {
                        if (hw._id === $scope.settings.selectedHardware) {
                           $scope.selectedHardware = hw;
                        }
                     });
                     $('#pleaseWaitDialog').modal('hide');

                     $('#pleaseWaitDialog').modal('hide');
                     $scope.loaeded = true;
                  }
               }
            });
         });

         $scope.updateSelectedHardware = function() {
            $scope.settings.selectedHardware = $scope.selectedHardware._id;
            Socket.emit('updateSettings', {
               settings: $scope.settings,
               hardware: $scope.selectedHardware
            }, function(err, response) {
               if (!err) {
                  $translate('ALERT_HARDWARE_CHOSEN_SUCCESS').then(function(txt) {
                     $rootScope.$broadcast('rootScope:showAlert', {
                        type: 'info',
                        text: txt + $scope.selectedHardware.name
                     });
                  });
                  $rootScope.$broadcast('rootScope:settingsUpdated', response.settings);
                  $scope.pendingChanges = false;

               } else {
                  $translate('ALERT_SETTINGS_SAVED_FAILED').then(function(txt) {
                     $rootScope.$broadcast('rootScope:showAlert', {
                        type: 'err',
                        text: txt + err
                     });
                  });
               }
            });
         };


         var setCurrentStep = function() {
            if ($scope.recipe.currentStep >= 0) {
               $scope.currentStep = $scope.recipe.steps[$scope.recipe.currentStep];
               $rootScope.$broadcast('rootScope:stepChanged', $scope.recipe.steps[$scope.recipe.currentStep].name);
            }
         };

         $scope.requestAddComment = function() {

            Socket.emit('addCommentToCurrentBrew', $scope.newComment, function(err, addedComment) {
               if (!err) {
                  $scope.recipe.logs.comments.push(addedComment.comment);
               }
            });
         };

         var initRecipe = function() {
            // set expanded if recipe is set
            $scope.recipe.expanded = true;

            // set current step
            setCurrentStep();

            // set chart data
            $rootScope.$broadcast('rootScope:initChart', $scope.recipe.logs);

         };

         var deInitRecipe = function() {
            $scope.recipe = null;
            brew = null;
            $rootScope.$broadcast('rootScope:RecipeUnloaded');

            $('#modalProcessfinished').modal('show');
            //$translate('ALERT_PROCESS_COMPLETED').then(function (txt) {
            //$rootScope.$broadcast('rootScope:showAlert',{type: 'success', text: txt, time: 10000});
            //});
         };

         if ($scope.recipe) {
            initRecipe();
         }

         // updating remaining time every 1000ms
         var remainingTimeIntervalID = setInterval(function() {
            if ($scope.currentStep && $scope.currentStep.endStepBy == 'time') {
               var diffInMs = 0;

               if ($scope.recipe && $scope.currentStep.tempReached == null) {
                  // general time
                  var startDate = new Date($scope.currentStep.started);
                  var startDateMS = startDate.getTime(); // add offset to startDate
                  startDate = new Date(startDateMS);
                  //var diffInMs = endDate.getTime() - new Date();

                  if ($scope.recipe.steps[$scope.recipe.currentStep]) {
                     // time for heating
                     var targetTemp = $scope.recipe.steps[$scope.recipe.currentStep].targetTemperature;
                     var currentTemp = $scope.temp1;
                     if (targetTemp > 91) {
                        targetTemp = 91;
                     }
                     var tempChangeRemaining = targetTemp - currentTemp; // can be negative
                     var cPerMinute = $scope.CperMin; // can be negative as well
                     var estHeatingDurationLeftMin = tempChangeRemaining / cPerMinute; // should be positive
                     var estHeatingDurationLeftMs = estHeatingDurationLeftMin * 60 * 1000;
                     $scope.estimatedTempReached = new Date(new Date().getTime() + estHeatingDurationLeftMs);

                     // time for holding
                     var estHoldingDurationLeftMs = $scope.currentStep.timeLimit * 60 * 1000;

                     // end
                     var end = new Date().getTime() + estHoldingDurationLeftMs + estHeatingDurationLeftMs; // minutes to ms
                     var endDate = new Date(end);
                     var endDate = new Date(endDate.getTime()); // add offset to endDate

                     // remaining time
                     diffInMs = estHoldingDurationLeftMs + estHeatingDurationLeftMs;

                     $scope.estimated = true;
                  }
               } else {
                  // general time
                  var startDate = new Date($scope.currentStep.tempReached);
                  var startDateMS = startDate.getTime(); // add offset to startDate
                  startDate = new Date(startDateMS);
                  var end = startDate.getTime() + $scope.currentStep.timeLimit * 60 * 1000; // minutes to ms
                  var endDate = new Date(end);
                  var endDate = new Date(endDate.getTime()); // add offset to endDate
                  diffInMs = endDate.getTime() - new Date();
                  $scope.estimated = false;
               }

               //$scope.remainingTime = startDate + " // " + endDate + " // " + new Date();

               if (diffInMs > 0) {

                  var days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
                  diffInMs -= days * (1000 * 60 * 60 * 24);

                  var hours = Math.floor(diffInMs / (1000 * 60 * 60));
                  diffInMs -= hours * (1000 * 60 * 60);

                  var mins = Math.floor(diffInMs / (1000 * 60));
                  diffInMs -= mins * (1000 * 60);

                  var seconds = Math.floor(diffInMs / (1000));
                  diffInMs -= seconds * (1000);

                  // little tweak
                  hours = hours + 24 * days;

                  $scope.stepEstFinish = endDate;
                  $scope.remainingTime = ("0" + hours).slice(-2) + ':' + ("0" + mins).slice(-2) + ':' + ("0" + seconds).slice(-2);
               }
            }
         }, 1000);

         $rootScope.$on('rootScope:RecipeLoaded', function(event) {
            $scope.recipe = brew;
            initRecipe();
         });

         // stepNumber being 0 indexed
         $scope.setNextStepRequest = function() {
            Socket.emit('setNextStep', {
               data: false
            }, function(err, data) {
               if (!err) {
                  initNewStep(data.number, data.step);
               }
            });
         };

         $scope.startAuto = function() {
            Socket.emit('startRecipe', {
               sudSizeLitres: $scope.recipe.sudSizeLitres
            }, function(err, currentBrew) {
               if (!err) {
                  $scope.recipe = currentBrew;
                  brew = currentBrew;
                  initRecipe();
                  $rootScope.$broadcast('rootScope:RecipeLoaded');

                  $translate('ALERT_PROCESS_STARTED').then(function(txt) {
                     $rootScope.$broadcast('rootScope:showAlert', {
                        type: 'success',
                        text: txt
                     });
                  });
               } else {
                  $translate('ALERT_PROCESS_STARTFAILED').then(function(txt) {
                     $rootScope.$broadcast('rootScope:showAlert', {
                        type: 'err',
                        text: txt + err
                     });
                  });
               }
            });

         };

         $scope.stopAuto = function() {
            Socket.emit('stopAuto', {
               data: false
            }, function(err, currentBrew) {
               if (!err) {
                  deInitRecipe();
               }
            });

         };

         $scope.abortAuto = function() {

            Socket.emit('startRecipe', {
               sudSizeLitres: $scope.recipe.sudSizeLitres
            }, function(err, currentBrew) {
               if (!err) {
                  Socket.emit('stopAuto', {
                     data: false
                  }, function(err, currentBrew) {
                     if (!err) {
                        deInitRecipe();
                        $rootScope.$broadcast('rootScope:RecipeAborted');


                        $translate('ALERT_PROCESS_ABORTED').then(function(txt) {
                           $rootScope.$broadcast('rootScope:showAlert', {
                              type: 'success',
                              text: txt
                           });
                        });
                     }
                  });
               }
            });

         };

         var initNewStep = function(newStepNum, step) {
            if ($scope.recipe != null) {
               $scope.recipe.currentStep = newStepNum;
               $scope.recipe.steps[newStepNum] = step;
               brew.currentstep = newStepNum;
               brew.steps[newStepNum] = step;
               setCurrentStep();
               $rootScope.$broadcast('rootScope:stepChanged', $scope.recipe.steps[newStepNum].name);

               $scope.stepEstFinish = "-";
               $scope.remainingTime = "-";
            }
         };



         var tempReachedUpdate = function(stepNum, step, date) {
            if ($scope.recipe != null) {
               $scope.recipe.currentStep = stepNum;
               $scope.recipe.steps[stepNum] = step;
               brew.currentstep = stepNum;
               brew.steps[stepNum] = step;
               setCurrentStep();
               $rootScope.$broadcast('rootScope:stepChanged', $scope.recipe.steps[stepNum].name);

               $scope.stepEstFinish = "-";
               $scope.remainingTime = "-";
            }
         };

         Socket.on('newStepSet', function(data) {
            initNewStep(data.number, data.step);
         });

         Socket.on('tempReached', function(data) {
            tempReachedUpdate(data.number, data.step, data.date);
         });

         Socket.on('automodeStopped', function(data) {
            deInitRecipe();
         });

         // get event from maincontrol
         $rootScope.$on('rootScope:physicsUpdate', function(event, physicsData) {
            $scope.temp1 = physicsData.firstTemp;
            $scope.CperMin = physicsData.deltaCperMin;
         });
      } catch (ex) {
         console.error("exception: error XXX", ex);
      }

   }]);

   App.controller('ManualController', ["$rootScope", "$scope", "Socket", "$translate", function($rootScope, $scope, Socket, $translate) {
      try {
         // model vars (interface to GUI)
         $scope.targetTemperature = null; // only to be used as model
         $scope.targetMode = 'heat'; // only to be used as model
         $scope.targetStirr = false; // only to be used as model
         $scope.autoMode = true;
         if (brew == null) {
            $scope.autoMode = false;
         }
         $scope.loaded = false;

         // controll vars, validated by server
         $scope.stirr = false;
         $scope.mode = 'heat'; // 'heat' or 'cool'
         $scope.temp1; // holdin the temp from sensor
         $scope.temp1target = null; // holding the target temparute
         $scope.motorWarningChecked = false; // holding the target temparute

         // vars, that are not necessary for GUI
         var tempInitialized = false;

         $('#pleaseWaitDialog').modal('show');

         Socket.emit('reportTab', "manual");

         $rootScope.$broadcast('rootScope:selectPartial', 2);

         Socket.emit('getMode', {
            data: 'not used'
         }, function(err, mode) {

            if (!err) {
               $scope.loaded = true;
               if (mode == 'auto')
                  $scope.autoMode = true;
               else {
                  Socket.emit('getControlState', {
                     data: 'not used'
                  }, function(err, controlState) {
                     if (!err) {
                        $scope.targetStirr = controlState.stirr;
                        $scope.targetMode = controlState.mode; // 'heat' or 'cool'
                        $scope.targetTemperature = controlState.targetTemperature; // holding the target temparute

                        if ($scope.targetTemperature != null) {
                           tempInitialized = true;
                        }


                        Socket.emit('getSettings', {
                           data: 'not used'
                        }, function(err, response) {
                           if (!err) {
                              $scope.motorWarningChecked = response.settings.motorWarningChecked;
                           }
                        });
                     }
                  });
               }
            }


            $('#pleaseWaitDialog').modal('hide');
         });

         // get event from maincontrol

         // get event from maincontrol
         $rootScope.$on('rootScope:physicsUpdate', function(event, physicsData) {
            $scope.temp1 = physicsData.firstTemp;

            if ($scope.targetTemperature == null &&
               tempInitialized === false) {
               $scope.targetTemperature = Math.round($scope.temp1);
               tempInitialized = true;
            }
         });

         $rootScope.$on('rootScope:RecipeLoaded', function(event) {
            $scope.autoMode = true;
         });

         $rootScope.$on('rootScope:RecipeUnloaded', function(event) {
            $scope.autoMode = false;
         });

         $scope.requestControl = function(newMode, newStirr, newTargetTemp) {
            Socket.emit('controlRequest', {
               mode: newMode,
               targetTemperature: newTargetTemp,
               stirr: newStirr
            }, function(err, response) {
               if (!err) {
                  // only broadcast the changes that really changed
                  var controlState = response.controlState;

                  if (newMode != null) {
                     $scope.mode = controlState.mode;
                     $scope.targetMode = controlState.mode;
                     $rootScope.$broadcast('rootScope:modeChange', newMode); // $rootScope.$on && $scope.$on
                  }
                  if (newStirr != null) {
                     $scope.stirr = controlState.stirr;
                     $scope.targetStirr = controlState.stirr;
                     $rootScope.$broadcast('rootScope:stirrChange', newStirr); // $rootScope.$on && $scope.$on
                  }
                  if (newTargetTemp != null) {
                     $scope.temp1target = controlState.targetTemperature;
                     $scope.targetTemperature = controlState.targetTemperature;
                     $rootScope.$broadcast('rootScope:targetTempChange', newTargetTemp); // $rootScope.$on && $scope.$on
                     $translate('ALERT_TARGETTEMP_SET_1').then(function(txt1) {
                        $translate('ALERT_TARGETTEMP_SET_2').then(function(txt2) {
                           $rootScope.$broadcast('rootScope:showAlert', {
                              type: 'info',
                              text: txt1 + $scope.temp1target + txt2
                           });
                        });
                     });
                  }
               } else {
                  $scope.targetMode = $scope.mode;
                  window.alert('failed to make control request');
               }
            });
         };

         // creates a copy of the recipe and loads it
         $scope.setMode = function(newMode) {
            $scope.requestControl(newMode, null, null);
         };

         $scope.enterSafeState = function() {
            Socket.emit('enterSafeState', {
               source: 'manual'
            }, function(err, response) {
               if (!err) {

                  $scope.targetStirr = false;

               } else {
                  $scope.targetMode = $scope.mode;
                  window.alert('failed to make control request');
               }
            });
         };

         // creates a copy of the recipe and loads it
         $scope.setStirr = function(newState) {
            $scope.requestControl(null, newState, null);
            //window.alert('mode set to: ' + $scope.mode);
         };

         // creates a copy of the recipe and loads it
         $scope.setTargetTemp = function() {
            $scope.requestControl(null, null, $scope.targetTemperature);
         };
      } catch (ex) {
         console.error("exception: error AutomaticController", ex);
      }
   }]);


   // recipe controller
   App.controller('RecipesController', ["$rootScope", "$scope", "Socket", "$translate", function($rootScope, $scope, Socket, $translate) {
      try {
         $scope.expanded = false; // if div is expanded or not
         $scope.recipes = []; // holding all recipes
         $scope.editedRecipeIdx = -1; // holding the index from recipes array
         $scope.editedStepIdx = -1; // holding the index from recipe.steps array
         $scope.alertMessage = 'default'; // holding the alert message

         $scope.editedRecipe = null; // if editing is cancelled, object will be trashed
         $scope.editedStep = null; // if editing is cancelled, object will be trashed
         $scope.recipeJSON = ''; // holding json for import/export
         $scope.recipeLoaded = brew != null; // indicates, if a recipe is currently loaded
         $scope.editView = true; // indicates, if editing controls are displayed or not

         $scope.Math = window.Math;

         bufferOnString = "on";
         bufferOffString = "off";

         $translate('ON').then(function(txt) {
            bufferOnString = txt;
         });
         $translate('OFF').then(function(txt) {
            bufferOffString = txt;
         });

         $rootScope.$broadcast('rootScope:selectPartial', 3);

         Socket.emit('reportTab', "recipes");

         $('#pleaseWaitDialog').modal('show');


         $scope.boolToStr = function(arg) {
            if (arg == true) {
               return bufferOnString;
            } else {
               return bufferOffString;
            }
         };

         $scope.dragControlListeners = {
            accept: function(sourceItemHandleScope, destSortableScope) {
               return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
            },
            itemMoved: function(event) {
               console.log("itemMoved");
               console.log(event);
            },
            orderChanged: function(event, $scope) {
               console.log("orderChanged");
               event.dest.sortableScope.$parent.$parent.setEditedRecipe(event.dest.sortableScope.$parent.recipe);
               console.log("order updated");
               event.dest.sortableScope.$parent.$parent.saveEditedRecipe();
               console.log(event);
            },
            containment: '#board' //optional param.
         };

         Socket.emit('getAllRecipes', {
            data: 'not used'
         }, function(err, response) {

            if (!err) {
               if (response['response']) {
                  var recipes = response.response;

                  // communicate the change
                  $rootScope.$broadcast('rootScope:recipesUpdated', recipes); // $rootScope.$on && $scope.$on
                  $('#pleaseWaitDialog').modal('hide');
               }
            }
         });

         $rootScope.$on('rootScope:recipesUpdated', function(event, recipes) {
            $scope.recipes = recipes;
         });

         $rootScope.$on('rootScope:RecipeLoaded', function(event) {});

         $rootScope.$on('rootScope:RecipeUnloaded', function(event) {
            $scope.recipeLoaded = false;
         });

         $scope.setEditedRecipe = function(recipe) {
            $scope.editedRecipe = angular.copy(recipe);
            $scope.editedRecipeIdx = $scope.recipes.indexOf(recipe);
            //window.alert('set edited recipe call - ' + $scope.recipes.indexOf(recipe));
         };

         $scope.debug = function() {
            window.alert(this.expanded);
         };

         //$scope.names = [{val:'bob'},{val:'lucy'},{val:'john'},{val:'luke'},{val:'han'}];
         //$scope.tempplayer = '';
         $scope.updateNames = function() {
            if ($scope.tempplayer === "") return;
            $scope.names.push({
               val: $scope.tempplayer
            });
            $scope.tempplayer = "";
         };
         $scope.checkForNameDelete = function($index) {
            if ($scope.names[$index].val === '') {
               $scope.names.splice($index, 1);
            }
         };

         // creates a copy of the recipe and loads it
         $scope.loadRecipe = function(recipe) {

            Socket.emit('loadRecipe', recipe._id, function(err, transformedRecipe) {
               if (!err) {
                  brew = transformedRecipe;
                  $rootScope.$broadcast('rootScope:RecipeLoaded');
                  $translate('ALERT_RECIPE_LOADED_SUCCESS').then(function(txt) {
                     $rootScope.$broadcast('rootScope:showAlert', {
                        type: 'success',
                        text: txt
                     });
                  });
               } else {
                  $translate('ALERT_RECIPE_LOADED_FAILED').then(function(txt) {
                     $rootScope.$broadcast('rootScope:showAlert', {
                        type: 'err',
                        text: txt + err
                     });
                  });
               }
            });

            // brew = angular.copy(recipe);

            // brew.activeStep = -1;
            // // do what needs to be done to transform a recipe to a brew

            // $scope.recipeLoaded = true;
            //
         };

         $scope.allRecipesToJSON = function() {
            $scope.recipeJSON = angular.toJson($scope.recipes);
         };

         $scope.createNewRecipeAndEdit = function() {
            //window.alert('call!');
            // index is set to len of array, therefore on a cancel
            // nothing will happen
            $scope.editedRecipeIdx = $scope.recipes.length;
            $scope.editedRecipe = blankRecipe;
         };

         $scope.createNewStepAndEdit = function() {
            // index is set to len of array, therefore on a cancel
            // nothing will happen
            var recipe = $scope.recipes[$scope.editedRecipeIdx];
            $scope.editedStepIdx = recipe.steps.length;
            $scope.editedStep = blankStep;

            // multiply minutes if its a cooling recipe
            // (gui says 'hours' but its bound to a minutes variablle)
            if ($scope.editedRecipe.mode == 'cool') {
               $scope.editedStep.timeLimit = $scope.editedStep.timeLimit / 60;
            }
         };

         $scope.setAlertMessage = function(speachID) {

            $translate(speachID).then(function(txt) {
               $scope.alertMessage = txt;
            });
         };

         // stepnumber is a number of the currently edited step in the recipe
         $scope.setEditedStep = function(recipe, step) {
            $scope.setEditedRecipe(recipe);
            $scope.editedStep = angular.copy(step);
            $scope.editedStepIdx = recipe.steps.indexOf(step);

            // multiply minutes if its a cooling recipe
            // (gui says 'hours' but its bound to a minutes variablle)
            if ($scope.editedRecipe.mode == 'cool') {
               $scope.editedStep.timeLimit = $scope.editedStep.timeLimit / 60;
            }
         };

         $scope.cancelEdit = function() {
            $scope.editedRecipe = null;
            $scope.editedStep = null;

         };

         $scope.duplicateRecipe = function(sourceRecipe) {
            // set edited recipe
            $scope.editedRecipeIdx = $scope.recipes.length;
            $scope.editedRecipe = angular.copy(sourceRecipe);

            // clear the databas _id attribute, to ensure that it will be stored as a new recipe
            $scope.editedRecipe._id = null;

            // set the name (attach copy of)
            $scope.editedRecipe.name = $scope.editedRecipe.name + ' (Kopie)';
         };

         $scope.finishStepEdit = function() {
            // multiply minutes if its a cooling recipe
            // (gui says 'hours' but its bound to a minutes variablle)
            if ($scope.editedRecipe.mode == 'cool') {
               $scope.editedStep.timeLimit = $scope.editedStep.timeLimit * 60;
            }

            // edit / add step
            $scope.editedRecipe.steps[$scope.editedStepIdx] = $scope.editedStep;

            // save to db
            $scope.saveEditedRecipe();

            // finish edit
            $scope.editedStepIdx = -1;
         };

         // deletes the currently edited recipe or step
         // detects automatically which to delete
         $scope.finishDelete = function() {
            //window.alert('finishDelete call!');
            if ($scope.editedStepIdx != -1) {
               // delete step
               $scope.editedRecipe.steps.splice($scope.editedStepIdx, 1);
               $scope.editedStepIdx = -1;

               $scope.saveEditedRecipe();

            } else if ($scope.editedRecipeIdx != -1) {
               // delete recipe
               $scope.recipes.splice($scope.editedRecipeIdx, 1);

               // delete recipe in db
               Socket.emit('deleteRecipe', $scope.editedRecipe);
            }
         };

         $scope.saveEditedRecipe = function() {
            delete $scope.editedRecipe.expanded; // dont save state info to db

            Socket.emit('upsertRecipe', $scope.editedRecipe, function(err, upsertedRecipe) {
               if (!err) {
                  $scope.editedRecipe = upsertedRecipe; // update with fresh object from db

                  // update in reipces
                  $scope.recipes[$scope.editedRecipeIdx] = $scope.editedRecipe;
                  $scope.editedRecipeIdx = -1;

                  // expand again
                  $scope.editedRecipe.expanded = true;
               }
            });
         };

         $scope.finishRecipeEdit = function() {
            $scope.saveEditedRecipe();
         };
      } catch (ex) {
         console.error("exception: error RecipesController", ex);
      }
   }]);


   // date1 is the date longer ago
   // display Seconds being bool
   var getTempvaluesBetween = function(start, end, values) {
      try {
         start = new Date(start);
         end = new Date(end);
         start = start.getTime();
         end = end.getTime();

         function matchesTimestamp(element) {
            var tsElement = new Date(element[0]);
            tsElement = tsElement.getTime();

            if (tsElement > start && tsElement < end) {
               return element;
            }
         }

         var filteredValues = values.filter(matchesTimestamp);

         var plainValues = [];
         filteredValues.forEach(function(elem, idx, array) {
            plainValues.push(elem[1]);
         });

         return plainValues;
      } catch (ex) {
         console.error("exception: error getTempvaluesBetween", ex);
      }
   };

   App.controller('DisplayCSVLogController', ["$rootScope", "$scope", "$sce", "$routeParams", "Socket", function($rootScope, $scope, $sce, $routeParams, Socket) {


      try {
         $scope.log_id = $routeParams.logID;
         $scope.log = null;

         $('#pleaseWaitDialog').modal('show');

         $scope.CSVstr = "";


         Socket.emit('getLogByID', $scope.log_id, function(err, receivedLog) {

            if (!err) {
               if (receivedLog) {
                  $scope.log = receivedLog;
                  $scope.duration = getTimeDiff($scope.log.started, $scope.log.finished, true);

                  // communicate the change
                  $rootScope.$broadcast('rootScope:logReceived', receivedLog);
                  $rootScope.$broadcast('rootScope:initDetailChart', $scope.log.logs);
                  $rootScope.$broadcast('rootScope:detailChartModeChange', $scope.log.mode);

                  ConvertToCSV($scope.log);

                  // update blob
                  var regex = /<br\s*[\/]?>/gi;
                  var blob = new Blob([$scope.CSVstr.replace(regex, "\r\n")], {
                     type: 'text/plain'
                  });
                  $scope.url = (window.URL || window.webkitURL).createObjectURL(blob);

                  // mark content as safe
                  $scope.CSVstr = $sce.trustAsHtml($scope.CSVstr);
               }
            }

            $('#pleaseWaitDialog').modal('hide');
         });

         function addLineToStr(str) {
            $scope.CSVstr = $scope.CSVstr + str + "<br/>";
         }

         function ConvertToCSV(logobj) {
            var array = typeof logobj != 'object' ? JSON.parse(logobj) : logobj;

            addLineToStr('name,' + logobj.name);
            addLineToStr('description,' + logobj.description);
            addLineToStr('mode,' + logobj.mode);
            addLineToStr('started,' + logobj.star);
            addLineToStr('finished,' + logobj.finished);


            $scope.CSVstr = $scope.CSVstr + toCsv(logobj.logs.temperature, null, null);
            $scope.CSVstr = $scope.CSVstr + toCsv(logobj.logs.step, null, null);
            $scope.CSVstr = $scope.CSVstr + toCsv(logobj.logs.heating, null, null);
         }

         // https://gist.github.com/JeffJacobson/2770509
         /**
          * Converts a value to a string appropriate for entry into a CSV table.  E.g., a string value will be surrounded by quotes.
          * @param {string|number|object} theValue
          * @param {string} sDelimiter The string delimiter.  Defaults to a double quote (") if omitted.
          */
         function toCsvValue(theValue, sDelimiter) {
            var t = typeof(theValue),
               output;

            if (typeof(sDelimiter) === "undefined" || sDelimiter === null) {
               sDelimiter = '"';
            }

            if (t === "undefined" || t === null) {
               output = "";
            } else if (t === "string") {
               output = sDelimiter + theValue + sDelimiter;
            } else {
               output = String(theValue);
            }

            return output;
         }

         /**
          * Converts an array of objects (with identical schemas) into a CSV table.
          * @param {Array} objArray An array of objects.  Each object in the array must have the same property list.
          * @param {string} sDelimiter The string delimiter.  Defaults to a double quote (") if omitted.
          * @param {string} cDelimiter The column delimiter.  Defaults to a comma (,) if omitted.
          * @return {string} The CSV equivalent of objArray.
          */
         function toCsv(objArray, sDelimiter, cDelimiter) {
            var i, l, names = [],
               name, value, obj, row, output = "",
               n, nl;

            // Initialize default parameters.
            if (typeof(sDelimiter) === "undefined" || sDelimiter === null) {
               sDelimiter = '"';
            }
            if (typeof(cDelimiter) === "undefined" || cDelimiter === null) {
               cDelimiter = ",";
            }

            for (i = 0, l = objArray.length; i < l; i += 1) {
               // Get the names of the properties.
               obj = objArray[i];
               row = "";
               if (i === 0) {
                  // Loop through the names
                  for (name in obj) {
                     if (obj.hasOwnProperty(name)) {
                        names.push(name);
                        row += [sDelimiter, name, sDelimiter, cDelimiter].join("");
                     }
                  }
                  row = row.substring(0, row.length - 1);
                  output += row;
               }

               output += "<br/>";
               row = "";
               for (n = 0, nl = names.length; n < nl; n += 1) {
                  name = names[n];
                  value = obj[name];
                  if (n > 0) {
                     row += ",";
                  }
                  row += toCsvValue(value, '"');
               }
               output += row;
            }

            return output;
         }
      } catch (ex) {
         console.error("exception: error getTempvaluesBetween", ex);
      }
   }]);




   App.controller('DisplayLogController', ["$rootScope", "$scope", "$routeParams", "Socket", function($rootScope, $scope, $routeParams, Socket) {
      try {
         $scope.log_id = $routeParams.logID;
         $scope.log = null;

         $('#pleaseWaitDialog').modal('show');

         Socket.emit('getLogByID', $scope.log_id, function(err, receivedLog) {

            if (!err) {
               if (receivedLog) {
                  $scope.log = receivedLog;
                  $scope.duration = getTimeDiff($scope.log.started, $scope.log.finished, true);

                  // communicate the change
                  $rootScope.$broadcast('rootScope:logReceived', receivedLog);
                  $rootScope.$broadcast('rootScope:initDetailChart', $scope.log.logs);
                  $rootScope.$broadcast('rootScope:detailChartModeChange', $scope.log.mode);
               }
            }

            $('#pleaseWaitDialog').modal('hide');
         });

         $scope.getStepStartEnd = function(stepNum) {
            var stepEnd = null;

            var isLastStep = (stepNum == $scope.log.steps.length - 1);
            if (isLastStep) {
               // use finished attribute of brew
               stepEnd = $scope.log.finished;
            } else {
               // use start of next step
               stepEnd = $scope.log.steps[stepNum + 1].started;
            }

            var stepReached = $scope.log.steps[stepNum].tempReached;

            var stepStart = $scope.log.steps[stepNum].started;

            return {
               start: stepStart,
               end: stepEnd,
               reached: stepReached
            };
         };

         $scope.getiOSDevice = function() {
            var uagent = navigator.userAgent.toLowerCase();

            if (uagent.search("iphone") > -1 ||
               uagent.search("ipod") > -1 ||
               uagent.search("ipad") > -1 ||
               uagent.search("appletv") > -1) {
               return true;
            } else {
               return false;
            }
         };

         $scope.getDeltaT = function(stepNum) {

            var stamps = $scope.getStepStartEnd(stepNum);
            var minutes = getTimeDiffMinutes(stamps.start, stamps.reached);
            var min = $scope.getStepMinTemp(stepNum);
            var max = $scope.getStepMaxTemp(stepNum);
            var tdiff = max - min;
            return tdiff / minutes;
         };

         $scope.getStepTargetTemp = function(stepNum) {
            return $scope.log.steps[stepNum].targetTemperature;
         };

         $scope.getStepDuration = function(stepNum, type) {
            if (type === 'change') {
               var stamps = $scope.getStepStartEnd(stepNum);
               return getTimeDiff(stamps.start, stamps.reached, true);
            } else if (type === 'hold') {
               var stamps = $scope.getStepStartEnd(stepNum);
               return getTimeDiff(stamps.reached, stamps.end, true);
            }
         };

         $scope.getStepMinTemp = function(stepNum) {
            var stamps = $scope.getStepStartEnd(stepNum);
            var values = getTempvaluesBetween(stamps.start, stamps.end, $scope.log.logs.temperature);

            return values.min();
         };

         $scope.getStepMaxTemp = function(stepNum) {
            var stamps = $scope.getStepStartEnd(stepNum);
            var values = getTempvaluesBetween(stamps.start, stamps.end, $scope.log.logs.temperature);

            return values.max();
         };

         $scope.getStepAvgTemp = function(stepNum) {
            var stamps = $scope.getStepStartEnd(stepNum);
            var values = getTempvaluesBetween(stamps.reached, stamps.end, $scope.log.logs.temperature);
            var sum = 0;
            for (var i = 0; i < values.length; i++) {
               sum += parseFloat(values[i], 10); //don't forget to add the base
            }

            return sum / values.length;
         };
      } catch (ex) {
         console.error("exception: error DisplayLogController", ex);
      }
   }]);


   App.controller('alertController', ["$rootScope", "$scope", "Socket", function($rootScope, $scope, Socket) {

      try {
         $scope.alertMessage = '';

         // call with
         // $rootScope.$broadcast('rootScope:showAlert',{type: 'info', text: 'this is the text', time: 1000});
         // supported are info, success, error
         // time is in ms, if null: default time, if 0: forever

         $rootScope.$on('rootScope:showAlert', function(event, alert) {

            var alertDiv = null;

            if (alert.type == 'success') {
               alertDiv = $('#alertSuccess');
            } else if (alert.type == 'err') {
               alertDiv = $('#alertFailed');
            } else if (alert.type == 'info') {
               alertDiv = $('#alertInfo');
            }

            if (alertDiv) {

               $scope.alertMsg = alert.text;

               alertDiv.addClass("in");
               var timeout = null;

               if (alert.time) {
                  timeout = alert.time;
               } else {
                  timeout = alertShowTimeMS;
               }

               if (timeout > 0) {

                  setTimeout(function() {
                     alertDiv.addClass("out");
                     alertDiv.removeClass("in");
                  }, timeout);
               }
            }
         });
      } catch (ex) {
         console.error("exception: error alertController", ex);
      }
   }]);

   App.controller('lostConnectionController', ["$rootScope", "$scope", "Socket", "$translate", function($rootScope, $scope, Socket, $translate) {

      try {
         $rootScope.$on('rootScope:physicsUpdate', function(event, physicsData) {
            $scope.lastPing = new Date();
            $('#modalLostConnection').modal('hide');
         });

         Socket.emit('getCurrentBrew', {
            nodata: true
         }, function(err, currentBrew) {
            if (!err) {
               if (currentBrew.currentStep >= 0) {
                  $scope.lastName = currentBrew.steps[currentBrew.currentStep].name;
               } else {
                  $scope.lastName = "";
               }
            } else {
               $scope.lastName = "";
            }
         });

         $rootScope.$on('rootScope:stepChanged', function(event, name) {
            $scope.lastName = name;
            console.log("lastname" + name);
         });

         var pingIntervallID = setInterval(function() {
            if ((new Date() - $scope.lastPing) > 5000) {
               $('#modalLostConnection').modal('show');
               $scope.$apply();
            }
         }, 2000);
      } catch (ex) {
         console.error("exception: error lostConnectionController", ex);
      }
   }]);

   App.controller('LogsController', ["$rootScope", "$scope", "$filter", "Socket", function($rootScope, $scope, $filter, Socket) {
      try {
         $scope.logs = null;
         $scope.duration = '-';
         $scope.loaded = false;
         $scope.noLogs = true;

         $rootScope.$broadcast('rootScope:selectPartial', 4);


         $('#pleaseWaitDialog').modal('show');
         Socket.emit('reportTab', "logs");



         Socket.emit('getAllLogsOverview', {
            data: 'not used'
         }, function(err, logs) {

            if (!err) {
               if (logs) {
                  $scope.logs = logs;

                  $scope.loaded = true;

                  if (logs.length > 0)
                     $scope.noLogs = false;

                  // communicate the change
                  $rootScope.$broadcast('rootScope:Logsreceived', logs);
               }
            }

            $('#pleaseWaitDialog').modal('hide');
         });

         $scope.logsFilterQuery = function(element) {
            return element.name.match($scope.searchString) ? true : false;
         };

         $rootScope.$on('rootScope:logRemoved', function(event, log) {
            var index = $scope.logs.indexOf(log);

            if (index > -1) {
               $scope.logs.splice(index, 1);
            }
         });
      } catch (ex) {
         console.error("exception: error LogsController", ex);
      }
   }]);

   //frontpage controller
   App.controller('FrontpageController', ["$scope", "Socket", function($scope, Socket) {
      try {
         $scope.loading = true;
         $scope.readys = [];
         $scope.name = '';

         Socket.on('hello', function(name) {
            $scope.name = name;
            $scope.loading = false;
         });

         Socket.on('ready', function() {
            $scope.readys.push('Ready Event!');
         });

         Socket.on('msg', function(data) {
            $scope.readys.push(data["usr"] + ': ' + data["msg"]);
         });

         $scope.setReady = function() {
            var data = {
               "usr": $scope.name,
               "msg": 'is ready'
            };
            Socket.emit('ready', data);
            $scope.readys.push(data["msg"]);
         };

         // $scope.submit = function() {
         //  var data = {
         //                         "usr": $scope.name,
         //                         "msg": $scope.msg
         //                     };

         //     Socket.emit('msg', data);

         //        $scope.readys.push(data["usr"] + ': ' + data["msg"]);
         // };

         $scope.submit = function() {

            Socket.emit('newRecipe', {
               email: $scope.name,
               sth: $scope.msg,
               sex: "female"
            });

            $scope.readys.push(data["usr"] + ': ' + data["msg"]);
         };
      } catch (ex) {
         console.error("exception: error FrontpageController", ex);
      }
   }]);


   App.directive('waitDlg', function() {
      return {
         restrict: 'E',
         templateUrl: 'partials/directives/wait-dlg.html',
         controller: function() {

         },
         controllerAs: 'waitDlgCtrl',
         scope: false // use parent scope
      };
   });


   function isEmpty(value) {
      try {
         return angular.isUndefined(value) || value === '' || value === null || value !== value;

      } catch (ex) {
         console.error("exception: error isEmpty", ex);
      }
   }

   App.directive('ngMin', function() {
      return {
         restrict: 'A',
         require: 'ngModel',
         link: function(scope, elem, attr, ctrl) {
            scope.$watch(attr.ngMin, function() {
               ctrl.$setViewValue(ctrl.$viewValue);
            });
            var minValidator = function(value) {
               var min = scope.$eval(attr.ngMin) || 0;
               if (!isEmpty(value) && value < min) {
                  ctrl.$setValidity('ngMin', false);
                  return undefined;
               } else {
                  ctrl.$setValidity('ngMin', true);
                  return value;
               }
            };

            ctrl.$parsers.push(minValidator);
            ctrl.$formatters.push(minValidator);
         }
      };
   });

   App.directive('ngMax', function() {
      return {
         restrict: 'A',
         require: 'ngModel',
         link: function(scope, elem, attr, ctrl) {
            scope.$watch(attr.ngMax, function() {
               ctrl.$setViewValue(ctrl.$viewValue);
            });
            var maxValidator = function(value) {
               var max = scope.$eval(attr.ngMax) || Infinity;
               if (!isEmpty(value) && value > max) {
                  ctrl.$setValidity('ngMax', false);
                  return undefined;
               } else {
                  ctrl.$setValidity('ngMax', true);
                  return value;
               }
            };

            ctrl.$parsers.push(maxValidator);
            ctrl.$formatters.push(maxValidator);
         }
      };
   });


   App.directive('logOverview', function() {
      return {
         restrict: 'E',
         templateUrl: 'partials/directives/log-overview.html',
         scope: {
            log: '=source',
         },
         controller: ["$rootScope", "$scope", "Socket", function($rootScope, $scope, Socket) {
            try {
               $scope.duration = getTimeDiff($scope.log.started, $scope.log.finished);

               $scope.requestDeleteLog = function(log, id) {

                  Socket.emit('deleteLog', id, function(err) {

                     if (!err) {
                        $rootScope.$broadcast('rootScope:logRemoved', log);
                     }
                  });
               };

               $scope.remove = function($event) {

                  /*
                      Comment all the following lines to see the showItem function being called
                      even when clicking on the Remove button.
                      You can play with commenting any line to test which is effective depending
                      on you browser version.
                  */

                  // Prevent bubbling to showItem.
                  // On recent browsers, only $event.stopPropagation() is needed
                  if ($event.stopPropagation) $event.stopPropagation();
                  if ($event.preventDefault) $event.preventDefault();
                  $event.cancelBubble = true;
                  $event.returnValue = false;


                  $('#modalReallyDeleteLog_' + $scope.log._id).modal('show');

               };

               $scope.requestCSV = function() {

                  window.alert(ConvertToCSV($scope.log));
               };
            } catch (ex) {
               console.error("exception: error logOverview Controller", ex);
            }
         }],
         controllerAs: 'logOverviewCtrl'
      };
   });

   App.directive('recipeStep', function() {
      return {
         restrict: 'E',
         templateUrl: 'partials/directives/recipe-step.html',
         controller: ["$scope", function($scope) {
            $scope.Math = window.Math;

         }],
         controllerAs: 'recipeStepCtrl',
         scope: false // use parent scope
      };
   });

   App.directive('recipe', function() {
      return {
         restrict: 'E',
         templateUrl: 'partials/directives/recipe.html',
         controller: ["$scope", function($scope) {}],
         controllerAs: 'recipeCtrl',
         scope: false // use parent scope
      };
   });

   App.directive('stopEvent', function() {
      return {
         restrict: 'A',
         link: function(scope, element, attr) {
            element.bind('click', function(e) {
               e.stopPropagation();
            });
         }
      };
   });

   App.directive('fileUpload', function() {
      return {
         scope: true, //create a new scope
         link: function(scope, el, attrs) {
            el.bind('change', function(event) {
               var files = event.target.files;
               //iterate files since 'multiple' may be specified on the element
               for (var i = 0; i < files.length; i++) {
                  //emit event upward
                  scope.$emit("fileSelected", {
                     file: files[i]
                  });
               }
            });
         }
      };
   });


   angular.module('Services', []).
   factory('Socket', ["$rootScope", function($rootScope) {
      var socket = io.connect();
      return {
         on: function(eventName, callback) {
            socket.on(eventName, function() {
               var args = arguments;
               $rootScope.$apply(function() {
                  callback.apply(socket, args);
               });
            });
         },
         emit: function(eventName, data, callback) {
            if (typeof data == 'function') {
               callback = data;
               data = {};
            }
            socket.emit(eventName, data, function() {
               var args = arguments;
               $rootScope.$apply(function() {
                  if (callback) {
                     callback.apply(socket, args);
                  }
               });
            });
         },
         emitAndListen: function(eventName, data, callback) {
            this.emit(eventName, data, callback);
            this.on(eventName, callback);
         }
      };
   }]);


   App.directive('smartFloat', ["$filter", function($filter) {
      try {
         var FLOAT_REGEXP_1 = /^-?\$?\d+(.\d{3})*(\,\d*)?$/; //Numbers like: 1.123,56
         var FLOAT_REGEXP_2 = /^-?\$?\d+(,\d{3})*(\.\d*)?$/; //Numbers like: 1,123.56
         return {
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl) {
               ctrl.$parsers.unshift(function(viewValue) {
                  if (FLOAT_REGEXP_1.test(viewValue)) {
                     ctrl.$setValidity('float', true);
                     return parseFloat(viewValue.replace('.', '').replace(',', '.'));
                  } else if (FLOAT_REGEXP_2.test(viewValue)) {
                     ctrl.$setValidity('float', true);
                     return parseFloat(viewValue.replace(',', ''));
                  } else {
                     ctrl.$setValidity('float', false);
                     return undefined;
                  }
               });
               ctrl.$formatters.unshift(
                  function(modelValue) {
                     return $filter('number')(parseFloat(modelValue), 2);
                  }
               );
            }
         };
      } catch (ex) {
         console.error("exception: error smartFloat", ex);
      }
   }]);

   App.filter('numberFixedLen', function() {
      return function(n, len) {
         var num = parseInt(n, 10);
         len = parseInt(len, 10);
         if (isNaN(num) || isNaN(len)) {
            return n;
         }
         num = '' + num;
         while (num.length < len) {
            num = '0' + num;
         }
         return num;
      };
   });


   App.controller('jsonUploadController', ["$scope", "$http", "Socket", function($scope, $http, Socket) {

      try {
         //a simple model to bind to and send to the server
         $scope.model = {
            name: "",
            comments: ""
         };

         //an array of files selected
         $scope.files = [];

         //listen for the file selected event
         $scope.$on("fileSelected", function(event, args) {
            $scope.$apply(function() {
               //add the file object to the scope's files collection
               $scope.files.push(args.file);
            });
         });


         // imports a recipe: stores to db and adds to javascript array
         // in case inserting to database was successfull
         $scope.importRecipe = function(importedRecipe) {
            Socket.emit('upsertRecipe', importedRecipe, function(err, response) {
               if (!err) {

                  // update in reipces
                  $scope.recipes.push(response);
               }
            });
         };

         $scope.importBeerXMLJsonObject = function(recipe) {
            var importedRecipe = {};

            importedRecipe.name = recipe.NAME;
            importedRecipe.description = recipe.TASTE_NOTES;
            importedRecipe.mode = "heat";
            importedRecipe.steps = new Array();
            recipe.MASH.MASH_STEPS.MASH_STEP.forEach(function(step, idx, array) {
               console.log(step.NAME + ", " + step.STEP_TEMP + ", " + step.STEP_TIME);

               tempStep = {};
               tempStep.name = step.NAME;
               tempStep.stirr = true;
               tempStep.targetTemperature = Math.round(step.STEP_TEMP);

               if (step.STEP_TIME != null) {
                  tempStep.endStepBy = "time";
                  tempStep.timeLimit = step.STEP_TIME;
               } else {
                  tempStep.endStepBy = "never";
                  tempStep.timeLimit = 0;
               }

               importedRecipe.steps.push(tempStep);
            });

            importedRecipe._id = null; // save as new recipe
            $scope.importRecipe(importedRecipe);
         }

         $scope.parseBeerXMLFiles = function() {

            if (window.FileReader) {


               $scope.files.forEach(function(file, idx, array) {
                  var reader = new FileReader();
                  reader.onloadend = function(ev) {
                     // after FileReader has finished, this.result holds the content of the file
                     try {
                        var contentXML = jQuery.parseXML(this.result);
                        //var contentJSON = xmlToJson(contentXML);
                        var contentJSON2 = xml2json(contentXML, "");
                        var jsonObjectSource = JSON.parse(contentJSON2);

                        if (jsonObjectSource.RECIPES.RECIPE instanceof Array) {

                           jsonObjectSource.RECIPES.RECIPE.forEach(function(recipe, idx, array) {
                              $scope.importBeerXMLJsonObject(recipe);
                           });
                        } else {
                           var recipe = jsonObjectSource.RECIPES.RECIPE;
                           $scope.importBeerXMLJsonObject(recipe);
                        }
                     } catch (exception) {
                        console.log(exception);
                     }
                  };
                  reader.readAsText(file);
                  if (idx === array.length - 1) {
                     $scope.files = [];
                  }
               });


            }
         };

         $scope.parseFiles = function() {

            if (window.FileReader) {


               $scope.files.forEach(function(file, idx, array) {
                  var reader = new FileReader();
                  reader.onloadend = function(ev) {
                     // after FileReader has finished, this.result holds the content of the file
                     importedRecipe = JSON.parse(this.result);
                     importedRecipe._id = null; // save as new recipe
                     $scope.importRecipe(importedRecipe);
                  };
                  reader.readAsText(file);
                  if (idx === array.length - 1) {
                     $scope.files = [];
                  }
               });

            }
         };
      } catch (ex) {
         console.error("exception: error jsonUploadController", ex);
      }
   }]);

   var blankRecipe = {
      name: 'Rezeptname',
      description: '',
      lastEdited: new Date(),
      mode: 'heat',
      steps: []
   };

   var blankStep = {
      name: 'Name des Rezeptschrittes',
      stirr: false,
      targetTemperature: 21,
      timeLimit: 0,
      endStepBy: 'never', // other values are 'time' and 'never'

   };

})();
