import {
  API, APIEvent, Logger, PlatformAccessory, PlatformAccessoryEvent, PlatformConfig, Service, Characteristic, IndependentPlatformPlugin,
} from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { TelevisionAccessory } from './tvAccessory';
import { Configuration } from './configuration';
import { Utilities } from './utilities';

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
    this.log.info('Finished initializing platform: ' + PLATFORM_NAME);

    api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
      this.log.info('Finished launching platform:', PLATFORM_NAME);
      this.publishExampleExternalAccessory();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    accessory.on(PlatformAccessoryEvent.IDENTIFY, () => {
      this.log.info('%s identified', accessory.displayName);
    });

    this.accessories.push(accessory);
  }

  removeAllAccessories() {
    this.log.info('removing all accessories');
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, this.accessories);
    this.accessories.splice(0, this.accessories.length);
  }

  publishExampleExternalAccessory() {
    this.removeAllAccessories();

    const tvName = this.config.name || 'Saphi TV';
    const uuidTv = this.api.hap.uuid.generate(PLUGIN_NAME + tvName);
    const tvAccessory = new this.api.platformAccessory(tvName, uuidTv);

    const uuidRemote = this.api.hap.uuid.generate(PLUGIN_NAME + tvName + ' Remote');
    const remoteAccessory = new this.api.platformAccessory(tvName + ' Remote', uuidRemote);

    const configuration = new Configuration(this.config);
    const utilities = new Utilities(configuration, this);

    new TelevisionAccessory(utilities, tvAccessory, remoteAccessory );
    this.log.info('Publishing TV & Remote');
    this.api.publishExternalAccessories(PLUGIN_NAME, [tvAccessory, remoteAccessory]);
  }
}
