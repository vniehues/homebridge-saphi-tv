import { API, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic, IndependentPlatformPlugin } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { TelevisionAccessory } from './platformAccessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class SaphiTvPlatform implements IndependentPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.publishExampleExternalAccessory();
    this.log.info('Finished initializing platform:', PLATFORM_NAME);
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    this.accessories.push(accessory);
  }

  publishExampleExternalAccessory() {
    const tvName = this.config.name || 'Saphi TV';

    const uuid = this.api.hap.uuid.generate(PLUGIN_NAME + tvName);

    const tvAccessory = new this.api.platformAccessory(tvName, uuid);
    const remoteAccessory = new this.api.platformAccessory(tvName + 'remote', uuid + 'remote');

    new TelevisionAccessory(this, tvAccessory, remoteAccessory, this.config);

    this.api.publishExternalAccessories(PLUGIN_NAME, [tvAccessory]);
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [remoteAccessory]);
  }
}
