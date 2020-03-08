use admin
db.addUser({
   user: "mongoadmin",
   pwd: "bierbotmongo123a",
   roles: ["userAdminAnyDatabase"]
})
use admin
db.auth("mongoadmin", "bierbotmongo123a")
use brewdb
db.addUser({
   user: "nodejsbierbot",
   pwd: "bierbotmongo123",
   roles: ["readWrite"]
})
exit
