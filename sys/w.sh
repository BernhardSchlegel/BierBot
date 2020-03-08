#! /bin/sh

# raspi-wifi-blindscript v4
#   A minimium command line script to configure Wi-Fi network on Raspbian 
#   system for Raspberry Pi(R) ARM computer. 
# Project HP: https://github.com/shamiao/raspi-wifi-blindscript
#
# Copyright (C) 2013 Sha Miao
# This program is released under the MIT license, see LICENSE file or 
# <http://opensource.org/licenses/MIT> for full text.
#
# See README for usage. 

###############################################################
#################### PLEASE EDIT THIS PART ####################
###############################################################

# SSID (aka. network name).
SSID=$1

# Network encryption method.
# * 'WPA' for WPA-PSK/WPA2-PSK (note: most Wi-Fi networks use WPA);
# * 'WEP' for WEP;
# * 'Open' for open network (aka. no password).
ENCRYPTION=$2

# Network password. (WPA-PSK/WPA2-PSK password, or WEP key)
PASSWORD=$3

###############################################################
####################   OK. STOP EDITING!   ####################
###############################################################

if [ $(id -u) -ne 0 ]; then
  printf "This script must be run as root. \n"
  exit 1
fi

NETID=$(wpa_cli add_network | tail -n 1)
if [ $NETID -gt 0 ]; then
    printf 'theres already a network configured... overwriting.\n'
    NETID=0
fi

printf 'Netid is %s...\n' "$NETID"
printf 'Using SSID %s...\n' "$SSID"
wpa_cli set_network $NETID ssid \""$SSID"\"
case $ENCRYPTION in
'WPA')
    wpa_cli set_network $NETID key_mgmt WPA-PSK
    printf 'Setting password ...\n'
    #printf 'Using password %s...\n' "$PASSWORD"
    wpa_cli set_network $NETID psk \"$PASSWORD\"
    ;;
'WEP')
    wpa_cli set_network $NETID wep_key0 $PASSWORD
    wpa_cli set_network $NETID wep_key1 $PASSWORD
    wpa_cli set_network $NETID wep_key2 $PASSWORD
    wpa_cli set_network $NETID wep_key3 $PASSWORD
    ;;
*)
    ;;
esac
wpa_cli enable_network $NETID
wpa_cli save_config

sudo ifdown --force wlan0
sudo ifup --force wlan0

