var brewlog = require('../libs/brewlog.js');
var configDB = require('../config/database.js');
var collections = ["recipes", "logs", "settings", "users", "sessions"]
const mongojs = require("mongojs");
//var db = mongojs(configDB.url, collections);
var db = mongojs(configDB.url, collections);
var User = require('./models/user'); // for changing the password
var util = require('util'); // util.inspect(updatedRecipe, false, null)


module.exports = function(app, express, passport, routeSettings, cors, switchHeatingCoolingFn, setResetModeFn, restoreFactorySettingsFn) {
   var switchHeatingCooling = switchHeatingCoolingFn;
   var resetModeFn = setResetModeFn;
   var restoreFactorySettings = restoreFactorySettingsFn;

   var busboy = require('connect-busboy'); //middleware for form/file upload
   var formidable = require('formidable');

   // normal routes ===============================================================

   // show the home page (will also have our login links)
   app.get('/', isNotLoggedIn, function(req, res) {
      res.render(__dirname + '/../views/index.ejs', {
         message: req.flash('loginMessage')
      });
   });
   app.use("/css", express.static(__dirname + '/../views/css'));
   app.use("/icon", express.static(__dirname + '/../views/icon'));

   app.get('/ping', cors(), function(req, res, next) {
      // enable CORS requests
      //res.header("Access-Control-Allow-Origin", "*");
      //res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

      res.json({
         bierBotName: routeSettings.bierBotname,
         cpuid: routeSettings.cpuid
      });
   });

   var resetTimeout = 30;
   var clickDuration = 10;
   var resetClicks = 0;
   var resetStep = 1;
   var resetData = {
      timeout: resetTimeout,
      duration: clickDuration,
      step: resetStep,
      warn: "Achtung: Durch einen Reset wird der BierBot auf den Auslieferungszustand zurück gesetzt. Alle Einstellungen, Rezepte, Equipment-Adaptionen und der aktuell ausgeführte Sud (falls vorhanden) gehen dann verloren - nur Logs bleiben erhalten.",
      manual: "Um den BierBot zurückzusetzen, zunächst angeschlossene Heizplatten und Kühlschränke abstecken, dann:",
      step1: "Klicke auf \"Reset starten\"",
      step2: "Zähle die Anzahl der Relais-Klicks",
      step3: "Gib dies Anzahl der Klicks ein und klick' auf \"Reset abschließen\"",
      s1Btn: "Reset starten",
      s2Desc: "Relais klickt... Bitte mitzählen.",
      s3Desc: "Bitte gib die Anzahl der Klicks ein:",
      s3Btn: "Reset abschließen",
      warnMsg: null
   };

   app.get('/reset', function(req, res) {
      brewlog.log("returning step #" + resetStep + " (target was 1)");
      resetData.step = resetStep;
      res.render(__dirname + '/../views/reset.ejs', resetData);
   });

   app.get('/resetStart', function(req, res) {
      brewlog.log("returning step #" + resetStep + " (target was 2/3)");
      resetData.step = resetStep;
      res.render(__dirname + '/../views/reset.ejs', resetData);
   });

   app.get('/resetFinalize', function(req, res) {
      brewlog.log("returning step #" + resetStep + " (target was 4)");
      resetData.step = resetStep;
      res.render(__dirname + '/../views/reset.ejs', resetData);
   });

   app.post('/resetStart', function(req, res) {
      brewlog.log("attempting reset...");

      if (resetStep != 1) {
         // show the user
         brewlog.log("show the user that relais starts clicking");
         resetData.step = resetStep;
         res.render(__dirname + '/../views/reset.ejs', resetData);
      }


      setTimeout(function() {
         brewlog.log("resetted step to 1 after " + resetTimeout + "s");
         resetStep = 1;
         resetModeFn(false);
      }, resetTimeout * 1000);

      resetStep = 2;

      resetModeFn(true);
      resetClicks = Math.floor(Math.random() * 15) + 1;
      var resetClicksLeft = resetClicks;

      brewlog.log("clicking relais " + resetClicks + " times...")

      var clickIntervalID = setInterval(function() {
         switchHeatingCooling();
         resetClicksLeft = resetClicksLeft - 1;

         if (resetClicksLeft == 0) {
            clearInterval(clickIntervalID);
            brewlog.log("clicking relais finished.")
         }
      }, 500);


      // click the relais random number of times

      // show the user
      brewlog.log("show the user that relais starts clicking");
      resetData.step = resetStep;
      res.render(__dirname + '/../views/reset.ejs', resetData);

      // click
      brewlog.log("relais clicking...");
      setTimeout(function() {
         brewlog.log("update user view to show final submit form");
         resetStep = 3;
         brewlog.log("reset request step# " + resetStep);
      }, clickDuration * 1000);

   });


   app.post('/resetFinalize', function(req, res) {
      brewlog.log("finalizing reset (step:" + resetStep + ")...");
      var clicksUserTold = parseInt(req.body.clickCount);

      if (resetStep != 3) {
         // tell user
         resetData.warnMsg = "Zu spät! Bitte nochmal versuchen."
         resetData.step = resetStep;
         res.render(__dirname + '/../views/reset.ejs', resetData);
         resetData.warnMsg = null;
         return;
      }

      if (clicksUserTold == resetClicks) {
         brewlog.log("clicks match: starting reset...");

         // tell user
         resetData.step = 4;
         resetData.warnMsg = "Der BierBot wird zurück gesetzt.";
         res.render(__dirname + '/../views/reset.ejs', resetData);
         resetData.warnMsg = null;

         // set default password
         User.findOne(function(err, usr) {
            if (err || usr == null) {
               brewlog.log("error getting user for password reset: " + err);
            } else {
               brewlog.log("Found user: \"" + util.inspect(usr, false, null) + "\"");

               var hash = usr.generateHash("bierbot123");
               usr.local.password = hash;

               usr.save(function(err) {
                  if (err) {
                     brewlog.log("error overriding user password: " + err);
                  } else {
                     brewlog.log("password sucessfully restored to \"bierbot123\"");
                  }
               });
            }
         });

         // restore Settings
         restoreFactorySettings();

         // only set step, rest will be handled by timeout
         resetStep = 1;
      } else {
         brewlog.log("clicks don't match (usr:" + clicksUserTold +
            ", target:" + resetClicks + "). aborting...");

         // tell user
         resetData.warnMsg = "Anzahl der Klicks falsch. Abbruch."
         resetData.step = 4;
         res.render(__dirname + '/../views/reset.ejs', resetData);
         resetData.warnMsg = null;

         // only set step, rest will be handled by timeout
         resetStep = 1;
      }

   });

   // actual app
   app.use('/secure', isLoggedIn);

   brewlog.log(__dirname);
   app.use('/secure', express.static(__dirname + '/../../client'));

   app.use('/reset', express.static(__dirname + '/../../reset'));

   app.get('/secure/logjson/:id', isLoggedIn, function(req, res, next) {

      var id = req.params.id;
      brewlog.log('getting json log (id = ' + id + ') ...');
      db.logs.find({
         _id: db.ObjectId(id)
      }, function(err, logs) {
         if (err || !logs) {
            res.json({
               err: 'No mathing log with id ' + id + ' found'
            });
            brewlog.log('No mathing log with id ' + id + ' found');
         } else {
            brewlog.log('found ' + logs.length + ' logs.');
            logs.forEach(function(log) {
               var brewDate = new Date(log.started);

               var datestr = brewDate.getFullYear() + "_" +
                  ("0" + (brewDate.getMonth() + 1)).slice(-2) + "_" +
                  ("0" + (brewDate.getDate())).slice(-2) + '_';

               res.setHeader('Content-disposition', 'attachment; filename=' + datestr + ((typeof log.sudNumber != 'undefined') ? '#' + log.sudNumber + '_' : '') + log.name + '.JSON');
               //res.writeHead(200, {'Content-Type': 'application/json'});
               //res.end = JSON.stringify(log);
               res.setHeader('Content-Type', 'application/json');
               res.end(JSON.stringify(log, null, 3));
               brewlog.log('response sent.');
            });
         }
      });
   });

   app.get('/secure/recipejson/:id', isLoggedIn, function(req, res, next) {

      var id = req.params.id;
      brewlog.log('getting json recipe (id = ' + id + ') ...');
      db.recipes.find({
         _id: db.ObjectId(id)
      }, function(err, recipes) {
         if (err || !recipes) {
            res.json({
               err: 'No mathing recipes with id ' + id + ' found'
            });
            brewlog.log('No mathing recipes with id ' + id + ' found');
         } else {
            brewlog.log('found ' + recipes.length + ' recipes.');
            recipes.forEach(function(recipe) {
               var brewDate = new Date(recipe.started);

               if (recipe.name.length == 0)
                  recipe.name = 'name missing';

               res.setHeader('Content-disposition', 'attachment; filename=' + recipe.name + '.JSON');
               //res.writeHead(200, {'Content-Type': 'application/json'});
               //res.end = JSON.stringify(log);
               res.setHeader('Content-Type', 'application/json');
               res.end(JSON.stringify(recipe, null, 3));
               brewlog.log('response sent.');
            });
         }
      });
   });

   // =============================================================================
   // AUTHENTICATE (FIRST LOGIN) ==================================================
   // =============================================================================

   // locally --------------------------------
   // LOGIN ===============================
   // show the login form
   // app.get('/login', function(req, res) {
   // 	res.render('login.ejs', { message: req.flash('loginMessage') });
   // });

   // process the login form
   /* OLD
   app.post('/login', passport.authenticate('local-login', {
   	successRedirect : '/secure', // redirect to the secure profile section
   	failureRedirect : '/', // redirect back to the signup page if there is an error
   	failureFlash : true // allow flash messages
   }));*/
   app.post('/login', function(req, res, next) {
      passport.authenticate('local-login', function(err, user, info) {
         if (err) {
            brewlog.log("login error: " + err);
            return res.redirect('/');
         } else if (info) {
            brewlog.log("login info: " + info);
            return res.redirect('/');
            //mysend(res, 401, 'unauthorized');
         } else {
            req.login(user, function(err) {
               if (err) {
                  brewlog.log("login error2: " + err);
               } else {
                  brewlog.log("login sucess, user: " + JSON.stringify(user));
                  return res.redirect('/secure');
               }
            });
         }
      })(req, res, next);
   });



   app.get('/change', isLoggedInHard, function(req, res) {
      res.render(__dirname + '/../views/change.ejs', {
         message: req.flash('changeMessage'),
         user: req.user.local.username
      });
   });

   app.post('/change', isLoggedInHard, passport.authenticate('local-change', {
      successRedirect: '/secure/#/settings', // redirect to the secure profile section
      failureRedirect: '/change', // redirect back to the signup page if there is an error
      failureFlash: true // allow flash messages
   }));



   // SIGNUP =================================
   // show the signup form
   if (1) {
      app.get('/signup', isLoggedIn, function(req, res) {
         res.render(__dirname + '/../views/signup.ejs', {
            message: req.flash('signupMessage')
         });
      });

      // process the signup form
      app.post('/signup', isLoggedIn, passport.authenticate('local-signup', {
         successRedirect: '/secure', // redirect to the secure profile section
         failureRedirect: '/', // redirect back to the signup page if there is an error
         failureFlash: true // allow flash messages
      }));
   }

   // locally --------------------------------
   app.get('/connect/local', function(req, res) {
      res.render('connect-local.ejs', {
         message: req.flash('loginMessage')
      });
   });
   app.post('/connect/local', passport.authenticate('local-signup', {
      successRedirect: '/profile', // redirect to the secure profile section
      failureRedirect: '/connect/local', // redirect back to the signup page if there is an error
      failureFlash: true // allow flash messages
   }));


   // route middleware to ensure user is logged in
   function isLoggedIn(req, res, next) {
      if (routeSettings.passwordDisabled || req.isAuthenticated()) {
         return next();
      }
      res.redirect('/');
   }

   // route middleware to ensure user is logged in, even if password is deactived
   // ensures that passwort cannot be changed, if user is not logged in
   function isLoggedInHard(req, res, next) {
      if (req.isAuthenticated()) {
         return next();
      }
      res.redirect('/');
   }

   // route middleware to ensure user is logged in
   function isNotLoggedIn(req, res, next) {

      if (routeSettings.passwordDisabled || req.isAuthenticated()) {
         res.redirect('/secure');
      }
      return next();
   }

};
