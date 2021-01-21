/* eslint-disable max-len */

import { Service, PlatformAccessory, CharacteristicSetCallback, CharacteristicGetCallback, PlatformConfig, Categories, Characteristic, CharacteristicValue } from 'homebridge';

import { SaphiTvPlatform } from './platform';

import fetch from 'node-fetch';
import wol from 'wake_on_lan';
import { Input } from './input';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class TelevisionAccessory {
  ambihue_url: string;
  ambi_poweron: boolean;
  ambi_poweroff: boolean;
  has_ambilight: boolean;
  name: string;
  // inputService: Service;

  waitFor(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  wolRequest(url) {
    return new Promise(() => {
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
    }
    );
  }

  timeoutAfter(ms, promise) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('TIMEOUT'))
      }, ms)

      promise
        .then(value => {
          clearTimeout(timer)
          resolve(value)
        })
        .catch(reason => {
          clearTimeout(timer)
          reject(reason)
        })
    })
  }

  private tvService: Service;
  private ambihueService?: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private TvState = {
    TvActive: false,
    AmbiHueActive: false,
  };

  power_url: string;
  input_url: string;

  protocol = 'http';

  ip_address: string;

  startup_time: number;
  public readonly inputs: Input[] = [];

  portNo = 1925;

  api_version = 6;

  power_on_body = { powerstate: 'On' };
  power_off_body = { powerstate: 'Standby' };



  ambihue_on_body = { power: 'On' };
  ambihue_off_body = { power: 'Off' };


  wol_url: string;

  constructor(
    private readonly platform: SaphiTvPlatform,
    private readonly accessory: PlatformAccessory,
    public readonly config: PlatformConfig,
  ) {
    this.ip_address = config.ip_adress as string;
    this.wol_url = config.wol_adress as string;
    this.startup_time = config.startup_time as number;
    this.ambi_poweron = config.ambi_poweron as boolean;
    this.ambi_poweroff = config.ambi_poweroff as boolean;
    this.has_ambilight = config.has_ambilight as boolean;
    this.inputs = config.inputs as [];
    this.name = config.name as string;

    this.platform.log.debug('inputs: ', this.inputs);

    this.input_url =
      this.protocol +
      '://' +
      this.ip_address +
      ':' +
      this.portNo +
      '/' +
      this.api_version +
      '/input/key';

    this.ambihue_url =
      this.protocol +
      "://" +
      this.ip_address +
      ":" +
      this.portNo +
      "/" +
      this.api_version +
      "/HueLamp/power";

    this.power_url =
      this.protocol +
      '://' +
      this.ip_address +
      ':' +
      this.portNo +
      '/' +
      this.api_version +
      '/powerstate';


    if (this.has_ambilight) {

      this.ambihueService = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);
      this.ambihueService.getCharacteristic(this.platform.Characteristic.On)
        .on('get', (callback) => {
          this.GetAmbiHue();
          callback(null, this.TvState.AmbiHueActive);
          this.platform.log.info('Get AmbiHue');
        })
        .on('set', (newValue, callback) => {
          this.SetAmbiHue(newValue);
          callback(null);
          this.platform.log.info('set AmbiHue => ' + newValue);
        });
    }



    // get/set the service
    this.tvService = this.accessory.getService(this.platform.Service.Television) || this.accessory.addService(this.platform.Service.Television);

    if (this.inputs && this.inputs.length > 0) {
      this.inputs.forEach((input: Input, index) => {
        const inputService = this.accessory.addService(this.platform.Service.InputSource, 'input' + input.position, input.name);
        inputService
          .setCharacteristic(this.platform.Characteristic.ConfiguredName, input.name)
          .setCharacteristic(this.platform.Characteristic.Identifier, index)
          .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.platform.Characteristic.CurrentVisibilityState.SHOWN)
          .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
          .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.APPLICATION);

        this.tvService.addLinkedService(inputService);
      });
    }


    // set accessory information
    this.accessory.category = Categories.TELEVISION;
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    // set the tv name
    this.tvService.setCharacteristic(this.platform.Characteristic.Name, this.name);
    this.tvService.setCharacteristic(this.platform.Characteristic.ConfiguredName, this.name);

    // set sleep discovery characteristic
    this.tvService.setCharacteristic(this.platform.Characteristic.SleepDiscoveryMode, this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

    // handle on / off events using the Active characteristic
    this.tvService.getCharacteristic(this.platform.Characteristic.Active)
      .on('set', (newValue, callback) => {
        callback(null);
        this.SetActive(newValue);
        this.platform.log.info('set Active => ' + newValue);
      })
      .on('get', (callback) => {
        callback(null, this.TvState.TvActive);
        this.GetActive();
        this.platform.log.info('Get Active');
      });

    this.tvService.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, 1);

    // handle input source changes
    this.tvService.getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .on('set', (newValue, callback) => {
        callback(null);
        this.SetActiveIdentifier(newValue);
        this.platform.log.info('set Active Identifier => setNewValue: ' + newValue);
      });

    // handle remote control input
    this.tvService.getCharacteristic(this.platform.Characteristic.RemoteKey)
      .on('set', (newValue, callback) => {
        switch (newValue) {
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
      this.GetActive();

      if (this.has_ambilight) {
        this.GetAmbiHue();
      }
      this.platform.log.debug('Triggering interval');
    }, 30000);
  }


  async GetActive() {
    await fetch(this.power_url)
      .then(response => response.json())
      .then(result => {
        this.platform.log.debug('Success:', result);
        if (JSON.stringify(result) === JSON.stringify(this.power_on_body)) {
          this.TvState.TvActive = true;
        } else if (JSON.stringify(result) === JSON.stringify(this.power_off_body)) {
          this.TvState.TvActive = false;
        }
        this.tvService.updateCharacteristic(this.platform.Characteristic.Active, this.TvState.TvActive);
      })
      .catch(error => {
        this.platform.log.debug('Error getPowerState : ', error);
        this.TvState.TvActive = false;
      });
  }

  async SetActive(value: CharacteristicValue) {
    const newPowerState = value === this.platform.Characteristic.Active.ACTIVE;
    this.platform.log.debug('Setting power to: ', newPowerState);
    if (newPowerState) {

      if (this.has_ambilight && this.ambi_poweron) {

        this.wolRequest(this.wol_url);
        await this.waitFor(this.startup_time)
          .then(() => {
            this.platform.log.debug('Setting AmbiHue after ', this.startup_time);
            this.ambihueService?.getCharacteristic(this.platform.Characteristic.On).setValue(true);
          }
          );

      }
      else {
        await this.wolRequest(this.wol_url);
      }
    } else {

      if (this.has_ambilight && this.ambi_poweroff) {
        await fetch(this.ambihue_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.ambihue_off_body),
        }).then(
          async () => {
            await this.waitFor(2500)
              .then(async () => {
                await fetch(this.input_url, {
                  method: 'POST', // or 'PUT'
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ key: 'Standby' }),
                });
              },
              );
          },
        );
      }
      else {
        await fetch(this.input_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key: 'Standby' }),
        });
      }
    }
  }

  async GetAmbiHue() {
    await fetch(this.ambihue_url)
      .then(response => response.json())
      .then(result => {
        this.platform.log.debug('Success:', result);
        if (JSON.stringify(result) === JSON.stringify(this.ambihue_on_body)) {
          this.TvState.AmbiHueActive = true;
        } else if (JSON.stringify(result) === JSON.stringify(this.ambihue_off_body)) {
          this.TvState.AmbiHueActive = false;
        }
        this.ambihueService?.updateCharacteristic(this.platform.Characteristic.On, this.TvState.AmbiHueActive);
      })
      .catch(error => {
        this.platform.log.debug('Error getAmbihueState : ', error);
        this.TvState.AmbiHueActive = false;
      });
  }

  async SetAmbiHue(value: CharacteristicValue) {
    const newPowerState = value;
    this.platform.log.debug('Setting ambihue to: ', newPowerState);
    if (newPowerState) {
      await fetch(this.ambihue_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.ambihue_on_body),
      });
    } else {
      await fetch(this.ambihue_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.ambihue_off_body),
      });
    }
  }


  async SetActiveIdentifier(value: CharacteristicValue) {
    const input = this.inputs[value as number];

    this.platform.log.debug('Setting input to: ', input.name);

    var keyToPress = { key: 'Home' };
    var stepsToMake = input.position;

    // Open application bar
    await fetch(this.input_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(keyToPress),
    })
    .then(async () => {await this.waitFor(300)})
      .then(async () => {

        if(stepsToMake === 0)
        {
          await fetch(this.input_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ key: 'Confirm' }),
          })
          .then(async () => {await this.waitFor(300)});
        }

        else if (stepsToMake >= 0)
        {

        for (let index = 0; index <= stepsToMake; stepsToMake--) {
          if (stepsToMake > 0) {
            this.platform.log.debug('right');
            keyToPress = { key: 'CursorRight' };
          } else if (stepsToMake == 0) {
            this.platform.log.debug('confirm');
            keyToPress = { key: 'Confirm' };
          }
          await fetch(this.input_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(keyToPress),
          })
          .then(async () => {await this.waitFor(300)});
        }

      }

      else if (stepsToMake <= 0)
      {


        for (let index = 0; index >= stepsToMake; stepsToMake++) {
          if (stepsToMake < 0) {
            this.platform.log.debug('left');
            keyToPress = { key: 'CursorLeft' };
          } else if (stepsToMake == 0) {
            this.platform.log.debug('confirm');
            keyToPress = { key: 'Confirm' };
          }
          await fetch(this.input_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(keyToPress),
          })
          .then(async () => {await this.waitFor(300)});
        }
      }
    }
      );
    
  }
}
