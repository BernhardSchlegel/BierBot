#!/bin/bash

if [ "$EUID" -ne 0 ]
  then echo "bierbot-setup must be run as root (prefix with sudo)"
  exit
fi

echo updating package lists...
sudo apt-get update -y

echo installing mongodb...
sudo apt-get install mongodb-server -y

echo starting mongodb service...
sudo service mongodb start

echo installing NodeJS...
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs

echo installing git...
sudo apt-get install git -y

echo cloning repo into /home/pi/BierBot
cd /home/pi
git clone --depth=1 https://github.com/BernhardSchlegel/BierBot.git
cd /home/pi/BierBot
git checkout develop
cd /home/pi

echo installing bower...
sudo npm install -g bower

echo installing gpio interface...
sudo apt-get install pigpio -y

echo chmodding rights of wireless tools and BierBot directory
sudo chmod -R u+x /home/pi/BierBot/sys
sudo chown -R 1000:0 /home/pi/BierBot/
sudo chmod -R u+w /home/pi/BierBot/

echo setting up users in mongodb
mongo < /home/pi/BierBot/setup/bierbot-setup-mongo.js

echo creating autostart...
sudo cp /home/pi/BierBot/sys/bierbot.service /etc/systemd/system/bierbot.service
sudo systemctl enable bierbot.service

#echo modifying network settings to enable wifi
#sudo tee /etc/network/interfaces < /home/pi/BierBot/sys/interfaces

echo installing dependencies for backend...
cd /home/pi/BierBot/server
sudo -u pi npm install

echo inizializing backend...
cd /home/pi/BierBot/server
sudo node setup.js

echo installing dependencies for frontend...
cd /home/pi/BierBot/client
sudo -u pi bower install

echo trying to bring wlan0 interface up.
sudo ifconfig wlan0 up
echo an error above is OK when you dont have an wifi adapter

echo enabling 1-wire protocol
if ! grep -q dtoverlay=w1-gpio /boot/config.txt; then echo dtoverlay=w1-gpio,gpiopin=4,pullup=on | sudo tee -a /boot/config.txt > /dev/null; fi
if ! grep -q w1-gpio /etc/modules; then echo w1-gpio | sudo tee -a /etc/modules > /dev/null; fi
if ! grep -q w1-therm /etc/modules; then echo w1-therm | sudo tee -a /etc/modules > /dev/null; fi

echo You may want to restart now: sudo reboot now
echo BierBot says: gut Sud!
