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
