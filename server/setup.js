var fs = require('fs');

function patchMongo(path) {
   return new Promise(resolve => {
      // https://github.com/mongo-js/mongojs/issues/300
      console.info("trying to patch " + path);
      var strToFind = "Proxy\.create\\(";
      var regexToFind = new RegExp(strToFind, 'g');
      var strToInject = "new Proxy({}, ";

      fs.readFile(path, 'utf8', function(err, data) {
         console.log('test');
         if (err) {
            console.log(err);
            return;
         }

         console.info("mongojs/index.js ready for patching");

         var result = data.replace(regexToFind, strToInject);

         fs.writeFile(path, result, 'utf8', function(err) {
            if (err) {
               console.log(err);
               resolve('err');
               return;
            } else {
               console.info("node_modules patched.");
               resolve('done');
            }
         });
      });
   });
}

function createUser() {
   return new Promise(resolve => {
      var configDB = require('./config/database.js');
      var mongoose = require('mongoose');
      mongoose.connect(configDB.url); // connect to our database
      var User = require('./app/models/user');

      var usr = new User({
         local: {
            username: "bierbot",
            password: "password",
         }
      });
      usr.local.password = usr.generateHash("bierbot123");

      usr.save(function(err) {
         console.info("YOYOY");
         if (err) {
            console.error("user creation failed: " + err);
            resolve('err');
         } else {
            console.info("user successfully created");
            resolve('done');
         }
      });
   });
}

async function setup() {
   console.log('setup started');

   console.info("patching mongo..."); // do this to enable user creation
   await patchMongo(__dirname + '/node_modules/mongojs/index.js');

   console.info("initializing user...");
   await createUser();

   console.info("prefilling database...");
   // the following import will fail before patch
   var restoreclear = require('./libs/restoreclear.js');
   restoreclear.restoreFactorySettings();

   console.info("setup completed.");
}

setup();
