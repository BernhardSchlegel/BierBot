<p align="center">
   <img width="300" src="/doc/img/BierBot-Logo_338x70.png" alt="BierBot Logo">
   <h1 align="center"> Raspberry Pi powered Brewing Software</h1>
</p>

This README is also available in [German ![Germany](https://raw.githubusercontent.com/stevenrskelton/flag-icon/master/png/16/country-4x3/de.png "Germany")](./doc/README_DE.MD)

## Key features

-   Runs on RaspberryPi (tested on RPi4)
-   Free, do-the-fuck-you-want Open Source license (MIT).
-   Easy to setup (one liner)
-   Simple: One senor, one relay.
-   PD-Controller that works with simple and cheap non PWM/SSR relay that require
    cooling and eliminates overshoots.
-   Modes for mashing and fermentation.
-   Multi-Language (German, English, pull-requests welcome).
-   Integreated recipes: Set the temperature, the time, etc.
-   Integerated logging: See your temperature log during the mash and export a PDF after brewing.
-   Authentication.
-   Works perfect on any iPhone, Android, Windows, Mac, Ubuntu system - or on
    the Raspberry Pi.

## Screenshots



## Software-Installation

### Prepare SD-Card and Raspberry Pi

1.  Download RASPBIAN BUSTER LITE from the [official website](https://www.raspberrypi.org/downloads/raspbian/).
    Recommended version is from February 2020 (Release Date 2002-02-13), with
    kernel version 4.19.
2.  Flash it to the SD-Card as described on the [setup page](https://www.raspberrypi.org/documentation/installation/installing-images/)
3.  Connect at least an (micro) HDMI Cable (Monitor), USB-Keyboard and microUSB
    (USB-C) for Power to your RaspberryPi (4). Wait for it to boot twice.
4.  Login using user `pi` and password `raspberry`
5.  Run (=type) `sudo raspi-config`,
    1.  select `5 Interfacing Options` > `P2 SSH` and confirm with `<yes>`
    2.  select `5 Interfacing Options` > `P7 1-Wire` and confirm with `<yes>`
    3.  _Optional_: If you want to connect to your WiFi: now is your time:
        select `2 Network options` > `N2 Wifi`. This is also possible via the
        BierBot Software later.
    4.  Also _optional_ but **recommended**: `1 Change user password`.
6.  You may now unplug your HDMI and keyboard and operate the RaspberryPi soley
    over Ethernet / WiFi.
7.  Connect to your router to figure out the IP of your RaspberryPi.

### Install the BierBot software

Now, we are ready to update the RaspberryPi and install all requirements, such as NodeJS and the database which is the promised **one-liner**.

```bash
cd ~ && wget https://raw.githubusercontent.com/BernhardSchlegel/BierBot/master/bierbot-setup.sh && chmod +x bierbot-setup.sh && sudo ./bierbot-setup.sh
```

**Congrats**, you're done.

If you want to know what the script does in the background, check out the
(potentially outdated) explanation [here](/doc/SETUP_MANUAL.MD).

## Hardware-Setup

The default BierBot wiring is as follows (I'll use the `RPi# (pigpio#)` syntax):

![BierBot Wiring](/doc/img/wiring.png)

- The [DS18B20](https://amzn.to/2TQrvxQ) sensor is connected to 3,3V, GND, and
  Pin Number RPi 7 (pi-gpio 7). With the latter being the data-channel of your sensor.
- The control channel of your Relais is connected to 11 (17). This will be used
  to turn on/off your heating / cooling device.
- Your motor (for stirring your mash) is connected to Pin 12 (18). This is a PWM
  Pin - which will be used. You can set your Motor Voltage on the BierBot
  settings page.
- Pin 13 (27) is *optional*: If you want your temperature sensor to be hot pluggable
  connect this pin. It will trigger an ISR on either edge (falling / rising) and
  is pulled via an internal resistor to ground.
- Pin 15 (22) is also *optional*: If you connect a [piezzo buzzer](https://amzn.to/2vDWe9D) the BierBot tells you with a beeping symphony when the next step is
  reached or the brew is finished.  

## TODOS

- migrate client package management from `bower` to `yarn`.

## Contributing

If you want to contribute, your Pull-Request or translation is very welcome!
Please see the [notes for developers](/doc/CONTRIBUTING.MD) to get you started!

## License

- My Code: [MIT](http://opensource.org/licenses/MIT)
- Orange Mash BierBot Logo: (c) by Bernhard Schlegel, all rights reserved.

Copyright (c) 2014-present, Bernhard Schlegel
