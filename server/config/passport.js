// load all the things we need

var brewlog = require('../libs/brewlog.js');
var LocalStrategy = require('passport-local').Strategy;

// load up the user model
var User = require('../app/models/user');

module.exports = function(passport) {

   // =========================================================================
   // passport session setup ==================================================
   // =========================================================================
   // required for persistent login sessions
   // passport needs ability to serialize and unserialize users out of session

   // used to serialize the user for the session
   passport.serializeUser(function(user, done) {
      done(null, user.id);
   });

   // used to deserialize the user
   passport.deserializeUser(function(id, done) {
      User.findById(id, function(err, user) {
         done(err, user);
      });
   });

   // =========================================================================
   // LOCAL LOGIN =============================================================
   // =========================================================================
   passport.use('local-login', new LocalStrategy({
         // by default, local strategy uses username and password, we will override with username
         usernameField: 'username',
         passwordField: 'password',
         passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
      },
      function(req, username, password, done) {
         brewlog.log('authenticating user (' + username + ') ...');

         if (username)
            username = username.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

         // asynchronous
         process.nextTick(function() {
            User.findOne({
               'local.username': username
            }, function(err, user) {
               // if there are any errors, return the error
               if (err)
                  return done(err);

               // if no user is found, return the message
               if (!user)
                  return done(null, false, req.flash('loginMessage', 'No user found.'));

               if (!user.validPassword(password))
                  return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

               // all is well, return user
               else
                  return done(null, user);
            });
         });

      }));

   // =========================================================================
   // LOCAL PASSWORD CHANGE ============================================================
   // =========================================================================
   passport.use('local-change', new LocalStrategy({
         // by default, local strategy uses username and password, we will override with username
         usernameField: 'username',
         passwordField: 'password',
         passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
      },
      function(req, username, password, done) {
         brewlog.log('changing password of ' + username + ' to ' + password);
         if (username)
            username = username.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

         // asynchronous
         process.nextTick(function() {
            // if the user is not already logged in:
            if (!req.user) {
               return done(null, false, req.flash('changeMessage', 'User not loggen in.'));
               // if the user is logged in but has no local account...
            } else if (!req.user.local.username) {
               return done(null, false, req.flash('changeMessage', 'User logged in, but no local account.'));
            } else {
               // user is logged in and already has a local account.
               User.findOne({
                  'local.username': username
               }, function(err, user) {
                  // if there are any errors, return the error
                  if (err) {
                     brewlog.log('finding user failed: ' + err);
                     return done(err);
                  }

                  // check to see if theres already a user with that username
                  if (user) {
                     brewlog.log('user found, attempting to change passphrase');

                     // change the the user
                     user.local.password = user.generateHash(password);

                     user.save(function(err) {
                        if (err) {
                           brewlog.log('failed to change password: ' + err);
                           return done(err);
                        }

                        brewlog.log('password changed successfully!');
                        return done(null, user);
                     });
                  } else {
                     return done(null, false, req.flash('changeMessage', 'User doesnt exist'));
                  }
               });
            }
         });
      }));

   // =========================================================================
   // LOCAL SIGNUP ============================================================
   // =========================================================================
   passport.use('local-signup', new LocalStrategy({
         // by default, local strategy uses username and password, we will override with username
         usernameField: 'username',
         passwordField: 'password',
         passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
      },
      function(req, username, password, done) {
         brewlog.log('signing up user (' + username + ') ...');
         if (username)
            username = username.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

         // asynchronous
         process.nextTick(function() {
            // if the user is not already logged in:
            if (!req.user) {
               User.findOne({
                  'local.username': username
               }, function(err, user) {
                  // if there are any errors, return the error
                  if (err)
                     return done(err);

                  // check to see if theres already a user with that username
                  if (user) {
                     return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                  } else {

                     // create the user
                     var newUser = new User();

                     newUser.local.username = username;
                     newUser.local.password = newUser.generateHash(password);

                     newUser.save(function(err) {
                        if (err)
                           return done(err);

                        return done(null, newUser);
                     });
                  }

               });
               // if the user is logged in but has no local account...
            } else if (!req.user.local.username) {
               // ...presumably they're trying to connect a local account
               // BUT let's check if the email used to connect a local account is being used by another user
               User.findOne({
                  'local.username': username
               }, function(err, user) {
                  if (err)
                     return done(err);

                  if (user) {
                     return done(null, false, req.flash('loginMessage', 'That username is already taken.'));
                     // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
                  } else {
                     var user = req.user;
                     user.local.username = username;
                     user.local.password = user.generateHash(password);
                     user.save(function(err) {
                        if (err)
                           return done(err);

                        return done(null, user);
                     });
                  }
               });
            } else {
               // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
               return done(null, req.user);
            }

         });

      }));

};
