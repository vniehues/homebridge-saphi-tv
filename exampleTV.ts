// // Example Television Plugin

// const PLUGIN_NAME = 'homebridge-example-tv';
// const PLATFORM_NAME = 'HomebridgeExampleTv';

// module.exports = (api) => {
//   api.registerPlatform(PLATFORM_NAME, ExampleTelevisionPlugin);
// };

// class ExampleTelevisionPlugin {
//   constructor(log, config, api) {
//     this.log = log;
//     this.config = config;
//     this.api = api;

//     this.Service = api.hap.Service;
//     this.Characteristic = api.hap.Characteristic;

//     // get the name
//     const tvName = this.config.name || 'Example TV';

//     // generate a UUID
//     const uuid = this.api.hap.uuid.generate('homebridge:my-tv-plugin' + tvName);

//     // create the accessory
//     this.tvAccessory = new api.platformAccessory(tvName, uuid);

//     // set the accessory category
//     this.tvAccessory.category = this.api.hap.Categories.TELEVISION;

//     // add the tv service
//     const tvService = this.tvAccessory.addService(this.Service.Television);

//     // set the tv name
//     tvService.setCharacteristic(this.Characteristic.ConfiguredName, tvName);

//     // set sleep discovery characteristic
//     tvService.setCharacteristic(this.Characteristic.SleepDiscoveryMode, this.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

//     // handle on / off events using the Active characteristic
//     tvService.getCharacteristic(this.Characteristic.Active)
//       .on('set', (newValue, callback) => {
//         this.log.info('set Active => setNewValue: ' + newValue);
//         tvService.updateCharacteristic(this.Characteristic.Active, 1);
//         callback(null);
//       });

//     tvService.setCharacteristic(this.Characteristic.ActiveIdentifier, 1);

//     // handle input source changes
//     tvService.getCharacteristic(this.Characteristic.ActiveIdentifier)
//       .on('set', (newValue, callback) => {

//         // the value will be the value you set for the Identifier Characteristic
//         // on the Input Source service that was selected - see input sources below.

//         this.log.info('set Active Identifier => setNewValue: ' + newValue);
//         callback(null);
//       });

//     // handle remote control input
//     tvService.getCharacteristic(this.Characteristic.RemoteKey)
//       .on('set', (newValue, callback) => {
//         switch(newValue) {
//           case this.Characteristic.RemoteKey.REWIND: {
//             this.log.info('set Remote Key Pressed: REWIND');
//             break;
//           }
//           case this.Characteristic.RemoteKey.FAST_FORWARD: {
//             this.log.info('set Remote Key Pressed: FAST_FORWARD');
//             break;
//           }
//           case this.Characteristic.RemoteKey.NEXT_TRACK: {
//             this.log.info('set Remote Key Pressed: NEXT_TRACK');
//             break;
//           }
//           case this.Characteristic.RemoteKey.PREVIOUS_TRACK: {
//             this.log.info('set Remote Key Pressed: PREVIOUS_TRACK');
//             break;
//           }
//           case this.Characteristic.RemoteKey.ARROW_UP: {
//             this.log.info('set Remote Key Pressed: ARROW_UP');
//             break;
//           }
//           case this.Characteristic.RemoteKey.ARROW_DOWN: {
//             this.log.info('set Remote Key Pressed: ARROW_DOWN');
//             break;
//           }
//           case this.Characteristic.RemoteKey.ARROW_LEFT: {
//             this.log.info('set Remote Key Pressed: ARROW_LEFT');
//             break;
//           }
//           case this.Characteristic.RemoteKey.ARROW_RIGHT: {
//             this.log.info('set Remote Key Pressed: ARROW_RIGHT');
//             break;
//           }
//           case this.Characteristic.RemoteKey.SELECT: {
//             this.log.info('set Remote Key Pressed: SELECT');
//             break;
//           }
//           case this.Characteristic.RemoteKey.BACK: {
//             this.log.info('set Remote Key Pressed: BACK');
//             break;
//           }
//           case this.Characteristic.RemoteKey.EXIT: {
//             this.log.info('set Remote Key Pressed: EXIT');
//             break;
//           }
//           case this.Characteristic.RemoteKey.PLAY_PAUSE: {
//             this.log.info('set Remote Key Pressed: PLAY_PAUSE');
//             break;
//           }
//           case this.Characteristic.RemoteKey.INFORMATION: {
//             this.log.info('set Remote Key Pressed: INFORMATION');
//             break;
//           }
//         }

//         // don't forget to callback!
//         callback(null);
//       });

//     /**
//      * Create a speaker service to allow volume control
//      */

//     const speakerService = this.tvAccessory.addService(this.Service.TelevisionSpeaker);

//     speakerService
//       .setCharacteristic(this.Characteristic.Active, this.Characteristic.Active.ACTIVE)
//       .setCharacteristic(this.Characteristic.VolumeControlType, this.Characteristic.VolumeControlType.ABSOLUTE);

//     // handle volume control
//     speakerService.getCharacteristic(this.Characteristic.VolumeSelector)
//       .on('set', (newValue, callback) => {
//         this.log.info('set VolumeSelector => setNewValue: ' + newValue);
//         callback(null);
//       });

//     /**
//      * Create TV Input Source Services
//      * These are the inputs the user can select from.
//      * When a user selected an input the corresponding Identifier Characteristic
//      * is sent to the TV Service ActiveIdentifier Characteristic handler.
//      */

//     // HDMI 1 Input Source
//     const hdmi1InputService = this.tvAccessory.addService(this.Service.InputSource, 'hdmi1', 'HDMI 1');
//     hdmi1InputService
//       .setCharacteristic(this.Characteristic.Identifier, 1)
//       .setCharacteristic(this.Characteristic.ConfiguredName, 'HDMI 1')
//       .setCharacteristic(this.Characteristic.IsConfigured, this.Characteristic.IsConfigured.CONFIGURED)
//       .setCharacteristic(this.Characteristic.InputSourceType, this.Characteristic.InputSourceType.HDMI);
//     tvService.addLinkedService(hdmi1InputService); // link to tv service

//     // HDMI 2 Input Source
//     const hdmi2InputService = this.tvAccessory.addService(this.Service.InputSource, 'hdmi2', 'HDMI 2');
//     hdmi2InputService
//       .setCharacteristic(this.Characteristic.Identifier, 2)
//       .setCharacteristic(this.Characteristic.ConfiguredName, 'HDMI 2')
//       .setCharacteristic(this.Characteristic.IsConfigured, this.Characteristic.IsConfigured.CONFIGURED)
//       .setCharacteristic(this.Characteristic.InputSourceType, this.Characteristic.InputSourceType.HDMI);
//     tvService.addLinkedService(hdmi2InputService); // link to tv service

//     // Netflix Input Source
//     const netflixInputService = this.tvAccessory.addService(this.Service.InputSource, 'netflix', 'Netflix');
//     netflixInputService
//       .setCharacteristic(this.Characteristic.Identifier, 3)
//       .setCharacteristic(this.Characteristic.ConfiguredName, 'Netflix')
//       .setCharacteristic(this.Characteristic.IsConfigured, this.Characteristic.IsConfigured.CONFIGURED)
//       .setCharacteristic(this.Characteristic.InputSourceType, this.Characteristic.InputSourceType.HDMI);
//     tvService.addLinkedService(netflixInputService); // link to tv service


//     /**
//      * Publish as external accessory
//      * Only one TV can exist per bridge, to bypass this limitation, you should
//      * publish your TV as an external accessory.
//      */

//     this.api.publishExternalAccessories(PLUGIN_NAME, [this.tvAccessory]);
//   }
// }