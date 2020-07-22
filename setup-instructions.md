# Jitsi-meet - Jibri - Jitsi-Video-Bridge setup instructions

## Jitsi Meet

Uses on lightsail instance. No auto scaling required.
Use this [guide](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-quickstart) to install jitsi-meet. After installing using this guide, clone this repo and do `npm i && sudo make`. (The domain and config in `config.js` should be set first accordingly)

- Ideally the JVB of this instance should be shutdown using `sudo systemctl stop jitsi-videobridge2.service` so that the Auto scaling group of JVB counts Network out of the Auto scaling group only and scale accordingly.
- For Jitsi-video-bridge and autoscaling, follow the guide [here](https://github.com/surepassio/jvb-essentials)
- For recording, make sure recording is turned on and the buttons are visible in `interface-config.js`. You need to configure 2 users in prosody using the following commands (These users and password will be required when setting up Jibri)
```
prosodyctl register jibri auth.jitsi.example.com Jibr1P@ssw0rd
prosodyctl register recorder recorder.jitsi.example.com Rec0rderP@ssw0rd
```

and follow the rest of the guide for Jibri [here](https://github.com/surepassio/jibri-essentials/edit/master/README.md)


### UFW Rules

The following rules should be set up in UFW in order for Jitsi to work with Jibri and JVB

```
Status: active

To                         Action      From
--                         ------      ----
80/tcp                     ALLOW       Anywhere                  
443/tcp                    ALLOW       Anywhere                  
4443/tcp                   ALLOW       Anywhere                  
10000/udp                  ALLOW       Anywhere                  
22/tcp                     ALLOW       Anywhere                  
5222/tcp                   ALLOW       Anywhere                  
10000:20000/udp            ALLOW       Anywhere                  
80/tcp (v6)                ALLOW       Anywhere (v6)             
443/tcp (v6)               ALLOW       Anywhere (v6)             
4443/tcp (v6)              ALLOW       Anywhere (v6)             
10000/udp (v6)             ALLOW       Anywhere (v6)             
22/tcp (v6)                ALLOW       Anywhere (v6)             
5222/tcp (v6)              ALLOW       Anywhere (v6)             
10000:20000/udp (v6)       ALLOW       Anywhere (v6)   
```
