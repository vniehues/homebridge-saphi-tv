
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="250">

</p>
<p align="center">
  
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

</p>

# Homebridge Philips TV SaphiOS

This plug-in provides Homebridge support for Philips TVs running SaphiOS.

## Info

Plug-in tested on 
- 55PUS6704 (API 6.1.0 )
- 65OLED754 (API 6.1.0 )

Working:

- Power funtions
  - Turning the TV on
  - Turning the TV off
- Ambilight functions
  - Turning Ambilight+Hue on
  - Turning Ambilight+Hue off
- Remote control functions (ControlCenter remote / widget)
  - Navigating menus
    - Arrows
    - Confirm
    - Back
  - volume control with hardware buttons 
  - Options
- Input functions (Configurable via config)
    - also exposable as switches for easy siri control
  - Watch TV Button
  - Applications
  - Input sources
  - TV Channels

What's next?

- Ambilight brightness
- Ambilight modes
- Ambilight+Hue modes
- Look into volume control with a slider
- arrangements within the home app

Some whishful thinking:
- Auto detect the TV in your local network
- Find a way to get the current channel/app/input

# Plug-in configuration
 For the best experience you should use the built-in config.
 If you can't use it for some reason you can use the config below as a reference.

          {
            "platform": "SaphiTV",
            "name": "TV",
            "ip_adress": "XXX.XXX.XXX.XXX",
            "wol_adress": "wol://XX:XX:XX:XX:XX:XX",
            "startup_time": 15,
            "timeout": 5,
            "input_delay": 650,
            "api_version": 6,
            "api_port_no": 1925,
            "protocol": "http",
            "polling_interval": 30,
            "has_ambilight": true,
            "has_ambihue": true,
            "has_tv_channels": true,
            "ambi_poweroff": false,
            "ambi_poweron": false,
            "inputs": [
                {
                    "name": "TV",
                    "type": "TV",
                    "position": 0
                },
                {
                    "name": "Netflix",
                    "type": "APP",
                    "position": 0
                },
                {
                    "name": "Youtube",
                    "type": "APP",
                    "position": -1
                },
                {
                    "name": "DMAX",
                    "type": "CHANNEL",
                    "position": 34
                }
            ]
         }

<!--
| Option                 | Description                                                                                                   | Default |  Example  |
|------------------------|---------------------------------------------------------------------------------------------------------------|---------|-----------|
| alternativePlayPause   | Sends Play or Pause alternating, based on internal state, instead of PlayPause to TV when not defined (false) | false   | true      |
| dedicatedMuteSwitch     | If enabled plugin register additional Switch Service that will mute, or unmute TV. Might be useful when setting scenes. | false   | true      |
| dedicatedVolumeLightbulb   | If enabled plugin register additional Lightbulb Service that will control Volume of TV. Might be useful when setting scenes. | false   | true      |
Maybe adding more options in table?
-->

The TV is registered as "External Accessory", it has to be added manually in Home app once.
Just tap on "+" -> "Add new Device" -> "No code" and you should see your TV. The code is the same as the one your Homebridge uses.

# References

Key knowledge about Philips TV APIs: https://github.com/eslavnov/pylips/wiki
Specific calls and adaptation as Homebridge plugin: https://github.com/98oktay/homebridge-philips-tv6#readme

