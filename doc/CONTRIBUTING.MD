## Notes for developers

General, short hints to get you started:

-   To stop the "production" instance of the BierBot, run `sudo systemctl stop bierbot.service`
-   Start the BierBot by `sudo node /home/pi/BierBot/server/server.js` (if node is not found, try `/usr/bin/node`)
-   Attach to nodeJS service `sudo node --inspect=0.0.0.0:9229 /home/pi/BierBot/server/server.js`
-   To view the service logs (might be helpful when the BierBot crashed) `journalctl -e -u bierbot.service`
    or `journalctl -u bierbot.service -f` to follow along.
-   To ease app for minification, annotation may be necessary. install ng-annotate (just for developement) 
    `sudo npm install -g  ng-annotate`. Use it: `ng-annotate -o app_annotated.js --add app.js` (run it from
    `./BierBot/client)`.

### Setting up Samba Fileshare

Setting up Samba Fileshare may ease the development process, since you can
launch the IDE of your choice on your dev machine an access essentially the
RaspberryPis filesystem:

- To setup a Windows (and Mac) compatible file share, run `sudo apt-get install samba -y` 
  (confirm with yes) followed by `sudo nano /etc/samba/smb.conf` and paste the following 
  contents at the end of the file ([credits](https://thisdavej.com/beginners-guide-to-installing-node-js-on-a-raspberry-pi/))
  
      [BierBotShare]
       comment=Raspi Share
       path=/home/pi
       browseable=Yes
       writeable=Yes
       only guest=No
       create mask=0740
       directory mask=0750
       public=no

  exit and save.

-   Now, create a samba fileshare user by `sudo smbpasswd -a pi` and assign him a
    password when prompted.

### Handy Stuff

To delete the current brew start the mongo console (`pi$ mongo`)

```
use brewdb
db.logs.remove({ currentBrew : true })
```

### Debugging the database

First, open your database for external access: Edit the config from mongo db
with the Nano / or vim editor `sudo nano /etc/mongodb.conf` and change the lines
 (to make the MongoDB accessible over Ethernet).

> :warning: **Warning** the combination of bind_ip and the default password is not  
> recommended as long term solution. Also: Do not include the brackets and
> anything in between.

    	# bind_ip = 127.0.0.1 (add the #)
    	port = 27017 (remove the #)
    	auth = true (remove the #)

Restart MongoDB `sudo service mongodb restart` to apply your changes.

For debugging db issues I recommend [Robo 3T](https://robomongo.org/download)
the following settings will work to authenticate:

    - Address: The Ip
    - Port: 27017
    - Perform authentication: Check (yes)
    - Database: brewdb
    - User name: nodejsbierbot
    - Password: bierbot123

### Creating a new image

-   Always start with a vanilla system
-   If you setup a WiFi network delete it  from `/etc/wpa_supplicant/wpa_supplicant.conf`
-   replace `version.js` by git pull (`updateFinished` needs to be false)

### Liscense

**TL;DR** If you contribute, your contribution is also under [MIT](.LICENSE).

**Long version**: By contributing, you certify to the following conditions:

Definitions.

"You" (or "Your") shall mean the copyright owner or legal entity authorized by
the copyright owner that is making this Agreement with Bernhard Schlegel. For
legal entities, the entity making a Contribution and all other entities that
control, are controlled by, or are under common control with that entity are
considered to be a single Contributor. For the purposes of this definition,
"control" means (i) the power, direct or indirect, to cause the direction or
management of such entity, whether by contract or otherwise, or (ii) ownership
of fifty percent (50%) or more of the outstanding shares, or (iii) beneficial
ownership of such entity.

Grant of Copyright License. Subject to the terms and conditions of this
 Agreement, You hereby grant to Bernhard Schlegel and to recipients of software
 distributed by Bernhard Schlegel a perpetual, worldwide, non-exclusive, no-charge,
 royalty-free, irrevocable copyright license to reproduce, prepare derivative works
 of, publicly display, publicly perform, sublicense, and distribute Your Contributions
 and such derivative works.

Grant of Patent License. Subject to the terms and conditions of this Agreement,
You hereby grant to Bernhard Schlegel and to recipients of software distributed
by Bernhard Schlegel a perpetual, worldwide, non-exclusive, no-charge,
royalty-free, irrevocable (except as stated in this section) patent license to
make, have made, use, offer to sell, sell, import, and otherwise transfer the
Work, where such license applies only to those patent claims licensable by You
that are necessarily infringed by Your Contribution(s) alone or by combination
of Your Contribution(s) with the Work to which such Contribution(s) was
submitted. If any entity institutes patent litigation against You or any other
entity (including a cross-claim or counterclaim in a lawsuit) alleging that your
 Contribution, or the Work to which you have contributed, constitutes direct or
 contributory patent infringement, then any patent licenses granted to that
 entity under this Agreement for that Contribution or Work shall terminate as
 of the date such litigation is filed.

You represent that You are legally entitled to grant the above license. You
represent further that each employee of the Corporation designated by You is
authorized to submit Contributions on behalf of the Corporation.

You represent that each of Your Contributions is Your original creation (see
   section 7 for submissions on behalf of others).

You are not expected to provide support for Your Contributions, except to the
extent You desire to provide support. You may provide support for free, for a
fee, or not at all. Unless required by applicable law or agreed to in writing,
You provide Your Contributions on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied, including, without limitation,
any warranties or conditions of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or
 FITNESS FOR A PARTICULAR PURPOSE.

Should You wish to submit work that is not Your original creation, You may submit
it to Bernhard Schlegel separately from any Contribution, identifying the
complete details of its source and of any license or other restriction
(including, but not limited to, related patents, trademarks, and license
agreements) of which you are personally aware, and conspicuously marking
the work as "Submitted on behalf of a third-party: [named here]".

It is your responsibility to notify Bernhard Schlegel when any change is
required to the list of designated employees authorized to submit Contributions
 on behalf of the Corporation, or to the Corporation's Point of Contact with
 Bernhard Schlegel.

Also, you certify that:

(a) The contribution was created in whole or in part by you and you have the
right to submit it under the open source license indicated in the file; or

(b) The contribution is based upon previous work that, to the best of your
knowledge, is covered under an appropriate open source license and you have
the right under that license to submit that work with modifications, whether
created in whole or in part by you, under the same open source license (unless
   you are permitted to submit under a different license), as indicated in the
   file; or

(c) The contribution was provided directly to you by some other person who
certified (a), (b) or (c) and I have not modified it.

(d) I understand and agree that this project and the contribution are public
and that a record of the contribution (including all personal information I
   submit with it, including my sign-off) is maintained indefinitely and may be
   redistributed consistent with this project or the open source license(s)
   involved
