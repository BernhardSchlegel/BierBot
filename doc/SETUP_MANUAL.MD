## Manual setup

This information is not kept up-to-date since it was replaced by the automated
install-script.

1. Get yourself an SSH client (such as [MobaXXterm](https://mobaxterm.mobatek.net/))
   and connect to your RaspberryPi using the IP-Address as shown by your router
   (in my case e.g. `192.168.178.194`).
- Update it to most current version by running `sudo apt-get update` and `sudo apt-get dist-upgrade`.
- In the following process we'll be using `nano` quite often, some basic commands
  are: <kbd>ctrl</kbd>+<kbd>c</kbd> to exit, and `Y` for saving

- First, we'll install MongoDB which is used to store logs, recipes, etc.:
  `sudo apt-get install mongodb-server` (confirm all that pops up with `Y`).
- To start mongo db as a service (which is required), type
  `sudo service mongodb start`.
- To install NodeJS, run `curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -` (yep, the dash belongs there)
  followed by `sudo apt-get install -y nodejs`.
- Check your install with `node -v`, this should yield something like `v10.XX.X` (e.g. `v10.19.0`).
- npm should already be installed, check with `npm --version`, which shoud yield
  something like `6.X.X` (e.g. `6.4.1` or `6.13.4`)
- Install git `sudo apt-get install git -y` (the lite version of Raspbian is lite, indeed).
- install `pigpio` using `sudo apt-get install pigpio`.
- clone the BierBot github repository to your home directory
```
cd ~
git clone https://github.com/BernhardSchlegel/BierBot.git
```
- update / chmod rights of wireless tools
```
sudo chmod -R u+x ~/BierBot/sys
sudo chown -R 1000:0 ~/BierBot/
sudo chmod -R u+w ~/BierBot/
```
- start mongo bash `mongo`
- in mongo bash paste commands to create database users
```
use admin
db.addUser({ user: "mongoadmin", pwd: "bierbotmongo123a", roles: ["userAdminAnyDatabase"] })
use admin
db.auth("mongoadmin", "bierbotmongo123a")
use brewdb
db.addUser({ user: "nodejsbierbot", pwd: "bierbotmongo123", roles: ["readWrite"] })
exit
```
- edit the config from mongo db with nano editor `sudo nano /etc/mongodb.conf` and
  change the lines (to make the MongoDB accessible over Ethernet). **Warning**
  the combination of bind_ip and the default password from above is not
  recommended as long term solution. Also: Do not include the brackets and
  anything in between.
```
	# bind_ip = 127.0.0.1 (add the #)
	port = 27017 (remove the #)
	auth = true (remove the #)
```
- Restart MongoDB `sudo service mongodb restart`.
- Add autostart for BierBot NodeJS server, run `sudo nano /etc/init.d/beernode`
  and paste the contents of the file `BierBot/utils/beernode`
- Set rights for file `sudo chmod +x /etc/init.d/beernode`
- Update the autostart configuration `sudo update-rc.d beernode defaults`
- This is only necessary, if you did not use `raspi-config`
   - Enable w1 temperature sensor, open config.txt `sudo nano /boot/config.txt`
   - add the following line to the end of file `dtoverlay=w1-gpio,gpiopin=4`
- for enabling wifi, open the interface configuration file `sudo nano /etc/network/interfaces`
- paste contents of `BierBot/utils/interfaces`, comment everything else (`#`
  at the beginning of the line).
- navigate into the `/server` (most likely `cd /home/pi/BierBot/server/`)
  directory and run `sudo npm install` to install all dependencies
- install bower package manager `sudo npm install -g bower` (folder you're in
  does not matter).
- navigate to the `/client` directory and run `bower install`.
