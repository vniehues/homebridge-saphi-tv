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
  polling_intervall: number;
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
    },
    );
  }

  timeoutAfter(ms, promise) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, ms);

      promise
        .then(value => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch(reason => {
          clearTimeout(timer);
          reject(reason);
        });
    });
  }

  fetchWithPromise = (url: string, body: string) =>
    new Promise((resolve, reject) => {

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body,
      })
        .then(resolve)
        .catch(reject);
    });

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
    this.ambi_poweron = config.ambi_poweron as boolean;
    this.ambi_poweroff = config.ambi_poweroff as boolean;
    this.has_ambilight = config.has_ambilight as boolean;
    this.inputs = config.inputs as [];
    this.name = config.name as string;

    this.startup_time = config.startup_time as number * 1000;
    this.polling_intervall = config.polling_intervall as number * 1000;

    this.platform.log.debug('times: ', this.startup_time, this.polling_intervall);
    if(this.startup_time < 5 * 1000 || typeof this.startup_time !== "number" || isNaN(this.startup_time))
    {
      this.startup_time = 10 * 1000;
    }
    if(this.polling_intervall < 15 * 1000 || typeof this.polling_intervall !== "number" || isNaN(this.polling_intervall))
    {
      this.polling_intervall = 30 * 1000;
    }
    this.platform.log.debug('times: ', this.startup_time, this.polling_intervall)

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
      '://' +
      this.ip_address +
      ':' +
      this.portNo +
      '/' +
      this.api_version +
      '/HueLamp/power';

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
          this.GetAmbiHue(callback);
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
        this.GetActive(callback);
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
        callback(null);
        this.SendRemoteInput(newValue);
        this.platform.log.info('Sending RemoteInput: ' + newValue);
      });



    setInterval(() => {
      this.GetActive(null);

      if (this.has_ambilight) {
        this.GetAmbiHue(null);
      }
      this.platform.log.debug('Triggering interval');
    }, this.polling_intervall);
  }


  async GetActive(callback) {
    await fetch(this.power_url)
      .then(response => response.json())
      .then(result => {
        this.platform.log.debug('Success:', result);
        if (JSON.stringify(result) === JSON.stringify(this.power_on_body)) {
          this.TvState.TvActive = true;
        } else if (JSON.stringify(result) === JSON.stringify(this.power_off_body)) {
          this.TvState.TvActive = false;
        }
      })
      .catch(error => {
        this.platform.log.debug('Error getPowerState : ', error);
        this.TvState.TvActive = false;
      })
      .finally(() => 
      {
        this.platform.log.debug('Now updating PowerState to:', this.TvState.TvActive);
        this.tvService.updateCharacteristic(this.platform.Characteristic.Active, this.TvState.TvActive);
        if(callback){callback(null, this.TvState.TvActive);}
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
          },
          );

      } else {
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
      } else {
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

  async GetAmbiHue(callback) {
    await fetch(this.ambihue_url)
      .then(response => response.json())
      .then(result => {
        this.platform.log.debug('Success:', result);
        if (JSON.stringify(result) === JSON.stringify(this.ambihue_on_body)) {
          this.TvState.AmbiHueActive = true;
        } else if (JSON.stringify(result) === JSON.stringify(this.ambihue_off_body)) {
          this.TvState.AmbiHueActive = false;
        }
      })
      .catch(error => {
        this.platform.log.debug('Error getAmbihueState : ', error);
        this.TvState.AmbiHueActive = false;
      })
      .finally(() => 
      {
        this.platform.log.debug('Now updating AmbiHueState to:', this.TvState.AmbiHueActive);
        this.tvService.updateCharacteristic(this.platform.Characteristic.Active, this.TvState.AmbiHueActive);
        if(callback){callback(null, this.TvState.AmbiHueActive);}
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

    if (input.isTV) {
      await fetch(this.input_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: 'WatchTV' }),
      })
        .then(response => response.text())
        .then(data => this.platform.log.debug('response: ', data))
        .then(async () => await this.waitFor(500))
        .then(() => {
          this.platform.log.debug('finished WatchTV');
        }).catch(() => {
          this.platform.log.debug('could not finish WatchTV');
        });
    }
    else {


      let stepsToMake = input.position;
      const moves: string[] = [];

      // Build the moves[]
      moves.push(JSON.stringify({ key: 'Home' }));
      while (Math.abs(stepsToMake) != 0) {
        if (stepsToMake > 0) {
          moves.push(JSON.stringify({ key: 'CursorRight' }));
          stepsToMake--;
        }
        if (stepsToMake < 0) {
          moves.push(JSON.stringify({ key: 'CursorLeft' }));
          stepsToMake++;
        }
      }
      moves.push(JSON.stringify({ key: 'Confirm' }));

      this.platform.log.debug('Moves: ', moves);


      // Execute moves[] one-by-one
      for (const move of moves) {
        await fetch(this.input_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: move,
        })
          .then(response => response.text())
          .then(data => this.platform.log.debug('response: ', data))
          .then(async () => await this.waitFor(500))
          .then(() => {
            this.platform.log.debug('finished move ', move);
          }).catch(() => {
            this.platform.log.debug('could not finish move ', move);
          });
      }

      this.platform.log.debug('finished moves!');
    }
  }


  async SendRemoteInput(newValue: CharacteristicValue) {
    let KeyToPress = { key: 'Home' };

    switch (newValue) {
      case this.platform.Characteristic.RemoteKey.REWIND: {
        KeyToPress = { key: 'Rewind' };
        break;
      }
      case this.platform.Characteristic.RemoteKey.FAST_FORWARD: {
        KeyToPress = { key: 'FastForward' };
        break;
      }
      case this.platform.Characteristic.RemoteKey.NEXT_TRACK: {

        KeyToPress = { key: 'Next' };
        break;
      }
      case this.platform.Characteristic.RemoteKey.PREVIOUS_TRACK: {

        KeyToPress = { key: 'Previous' };
        break;
      }
      case this.platform.Characteristic.RemoteKey.ARROW_UP: {

        KeyToPress = { key: 'CursorUp' };
        break;
      }
      case this.platform.Characteristic.RemoteKey.ARROW_DOWN: {

        KeyToPress = { key: 'CursorDown' };
        break;
      }
      case this.platform.Characteristic.RemoteKey.ARROW_LEFT: {

        KeyToPress = { key: 'CursorLeft' };
        break;
      }
      case this.platform.Characteristic.RemoteKey.ARROW_RIGHT: {

        KeyToPress = { key: 'CursorRight' };
        break;
      }
      case this.platform.Characteristic.RemoteKey.SELECT: {

        KeyToPress = { key: 'Confirm' };
        break;
      }
      case this.platform.Characteristic.RemoteKey.BACK: {

        KeyToPress = { key: 'Back' };
        break;
      }
      case this.platform.Characteristic.RemoteKey.EXIT: {

        KeyToPress = { key: 'Exit' };
        break;
      }
      case this.platform.Characteristic.RemoteKey.PLAY_PAUSE: {

        KeyToPress = { key: 'PlayPause' };
        break;
      }
      case this.platform.Characteristic.RemoteKey.INFORMATION: {

        KeyToPress = { key: 'Options' };
        break;
      }
    }

    await fetch(this.input_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(KeyToPress),
    })
  }
}
