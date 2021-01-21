/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable max-len */
import { Service, PlatformAccessory, CharacteristicSetCallback, CharacteristicGetCallback, PlatformConfig, Categories, Characteristic, CharacteristicValue } from 'homebridge';

import { SaphiTvPlatform } from './platform';

import fetch from 'node-fetch';
import wol from 'wake_on_lan';
import { DH_UNABLE_TO_CHECK_GENERATOR } from 'constants';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class TelevisionAccessory {
  input_url: string;  
  
  waitFor(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  wolRequest(url) {
    return new Promise(resolve => setTimeout(() => {
      const that = this;

      this.platform.log.debug('calling WOL with URL %s', url);
      if (!url) {
        that.platform.log.warn('WOL-Error: ');
        return;
      }
      if (url.substring(0, 3).toUpperCase() === 'WOL') {
      //Wake on lan request
        const macAddress = url.replace(/^WOL[:]?[/]?[/]?/gi, '');
        this.platform.log.debug('Executing WakeOnLan request to ' + macAddress);
        wol.wake(macAddress, (error) => {
          if (error) {
            that.platform.log.warn('WOL-Error: ', error);
          } else {
            that.platform.log.warn('WOL-OK!');
          }
        });
      } else {
        if (url.length > 3) {
          that.platform.log.warn('WOL-Error: ');
        } else {
          that.platform.log.warn('WOL-Error: ');
        }
      }
    }, 20));
  }

  private service: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private TvState = {
    TvActive: false,
    AmbiHueActive: false,
  };

  power_url: string;

  protocol= 'http';

  ip_address: string;

  portNo= 1925;

  api_version= 6;
    
  power_on_body = { powerstate: 'On' };

  power_off_body = { powerstate: 'Standby' };
  wol_url: string;

  constructor(
    private readonly platform: SaphiTvPlatform,
    private readonly accessory: PlatformAccessory,
    public readonly config: PlatformConfig,
  ) {
    this.ip_address = config.ip_adress as string;
    this.wol_url = config.wol_adress as string;

    this.input_url =
    this.protocol +
    'http://' +
    this.ip_address +
    ':' +
    this.portNo +
    '/' +
    this.api_version +
    '/input/key';
    
    // this.ambihue_url =
    // this.protocol +
    // "://" +
    // this.ip_address +
    // ":" +
    // this.portNo +
    // "/" +
    // this.api_version +
    // "/HueLamp/power";
    
    // this.ambihue_on_body = JSON.stringify({ power: "On" });
    // this.ambihue_off_body = JSON.stringify({ power: "Off" });
    
    this.power_url =
          this.protocol +
          '://' +
          this.ip_address +
          ':' +
          this.portNo +
          '/' +
          this.api_version +
          '/powerstate';





    // get/set the service 
    this.service = this.accessory.getService(this.platform.Service.Television) || this.accessory.addService(this.platform.Service.Television);

    // set accessory information
    this.accessory.category = Categories.TELEVISION;
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Test-Serial');

    // set the tv name
    this.service.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'test');

    // set sleep discovery characteristic
    this.service.setCharacteristic(this.platform.Characteristic.SleepDiscoveryMode, this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

    // handle on / off events using the Active characteristic
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .on('set', (newValue, callback) => {
        this.SetActive(newValue, callback);
        this.platform.log.info('set Active => setNewValue: ' + newValue);
        // this.service.updateCharacteristic(this.platform.Characteristic.Active, 1);
        // callback(null);
      })
      .on('get', (callback) => {
        this.GetActive( callback);
        this.platform.log.info('Get Active');
        // this.service.updateCharacteristic(this.platform.Characteristic.Active, 1);
        // callback(null);
      }) ;

    this.service.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, 1);

    // handle input source changes
    this.service.getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .on('set', (newValue, callback) => {

        // the value will be the value you set for the Identifier Characteristic
        // on the Input Source service that was selected - see input sources below.

        this.platform.log.info('set Active Identifier => setNewValue: ' + newValue);
        callback(null);
      });

    // handle remote control input
    this.service.getCharacteristic(this.platform.Characteristic.RemoteKey)
      .on('set', (newValue, callback) => {
        switch(newValue) {
          case this.platform.Characteristic.RemoteKey.REWIND: {
            this.platform.log.info('set Remote Key Pressed: REWIND');
            break;
          }
          case this.platform.Characteristic.RemoteKey.FAST_FORWARD: {
            this.platform.log.info('set Remote Key Pressed: FAST_FORWARD');
            break;
          }
          case this.platform.Characteristic.RemoteKey.NEXT_TRACK: {
            this.platform.log.info('set Remote Key Pressed: NEXT_TRACK');
            break;
          }
          case this.platform.Characteristic.RemoteKey.PREVIOUS_TRACK: {
            this.platform.log.info('set Remote Key Pressed: PREVIOUS_TRACK');
            break;
          }
          case this.platform.Characteristic.RemoteKey.ARROW_UP: {
            this.platform.log.info('set Remote Key Pressed: ARROW_UP');
            break;
          }
          case this.platform.Characteristic.RemoteKey.ARROW_DOWN: {
            this.platform.log.info('set Remote Key Pressed: ARROW_DOWN');
            break;
          }
          case this.platform.Characteristic.RemoteKey.ARROW_LEFT: {
            this.platform.log.info('set Remote Key Pressed: ARROW_LEFT');
            break;
          }
          case this.platform.Characteristic.RemoteKey.ARROW_RIGHT: {
            this.platform.log.info('set Remote Key Pressed: ARROW_RIGHT');
            break;
          }
          case this.platform.Characteristic.RemoteKey.SELECT: {
            this.platform.log.info('set Remote Key Pressed: SELECT');
            break;
          }
          case this.platform.Characteristic.RemoteKey.BACK: {
            this.platform.log.info('set Remote Key Pressed: BACK');
            break;
          }
          case this.platform.Characteristic.RemoteKey.EXIT: {
            this.platform.log.info('set Remote Key Pressed: EXIT');
            break;
          }
          case this.platform.Characteristic.RemoteKey.PLAY_PAUSE: {
            this.platform.log.info('set Remote Key Pressed: PLAY_PAUSE');
            break;
          }
          case this.platform.Characteristic.RemoteKey.INFORMATION: {
            this.platform.log.info('set Remote Key Pressed: INFORMATION');
            break;
          }
        }

        // don't forget to callback!
        callback(null);
      });

    setInterval(() => {

      // TODO: Add getPowerState and getAmbilightState here and update every minute.

      // push the new value to HomeKit
      // motionSensorOneService.updateCharacteristic(this.platform.Characteristic.MotionDetected, motionDetected);
      // motionSensorTwoService.updateCharacteristic(this.platform.Characteristic.MotionDetected, !motionDetected);

      this.platform.log.debug('Triggering interval:', 'test');
    }, 60000);
  }

  // setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {

  //   // implement your own code to turn your device on/off
  //   this.exampleStates.On = value as boolean;

  //   this.platform.log.debug('Set Characteristic On ->', value);

  // }

  async GetActive(callback: CharacteristicGetCallback) {
    
    const isOn = this.TvState.TvActive;
    callback(null, isOn);

    await fetch(this.power_url)
      .then(response => response.json())
      .then(result => {
        this.platform.log.debug('Success:', result);
        if(JSON.stringify(result) === JSON.stringify(this.power_on_body)) {
          this.TvState.TvActive = true;
        } else if(JSON.stringify(result) === JSON.stringify(this.power_off_body)) {
          this.TvState.TvActive = false;
        }
      })
      .catch(error => {
        this.platform.log.debug('Error getPowerState : ', error);
        this.TvState.TvActive = false;
      });
    this.service.updateCharacteristic(this.platform.Characteristic.Active, this.TvState.TvActive);
  }

  async SetActive(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    callback(null);
    const newPowerState = value === this.platform.Characteristic.Active.ACTIVE;
    this.platform.log.debug('Setting power to: ', newPowerState);
    if (newPowerState){
      await this.wolRequest(this.wol_url);
      //TODO: Hier Ambilight stuff einfügen
      // .then(
      //   async () => {
      //     await this.waitFor(2000)
      //       .then( async () => {
      //         await fetch(this.input_url, {
      //           method: 'POST', // or 'PUT'
      //           headers: {
      //             'Content-Type': 'application/json',
      //           },
      //           body: JSON.stringify({key: 'Standby'}),
      //         });
      //       },
      //       );
      //   },
      // );
    } else {
      await fetch(this.input_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({key: 'Standby'}),
      });
      //TODO: Hier Ambilight stuff einfügen// .then(
      //   async () => {
      //     await this.waitFor(2000)
      //       .then( async () => {
      //         await fetch(this.input_url, {
      //           method: 'POST', // or 'PUT'
      //           headers: {
      //             'Content-Type': 'application/json',
      //           },
      //           body: JSON.stringify({key: 'Standby'}),
      //         });
      //       },
      //       );
      //   },
      // );
    }

    // const response = await fetch(
    //   'https://jsonplaceholder.typicode.com/todos',
    // );
    // await this.waitFor(3000);
    // // you must call the callback function
  }
}
