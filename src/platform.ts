import {
  API,
  IndependentPlatformPlugin,
  Logging,
  PlatformConfig,
} from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { TelevisionAccessory } from './platformAccessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class SaphiTvPlatform implements IndependentPlatformPlugin {
  private readonly log: Logging;
  private readonly api: API;
  private readonly config: PlatformConfig;

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.config = config;
    this.api = api;

    this.publishExampleExternalAccessory();

    this.log.info('Finished initializing platform:', PLATFORM_NAME);
  }

  publishExampleExternalAccessory() {
    const tvName = this.config.name || 'Saphi TV';
    const uuid = this.api.hap.uuid.generate(PLUGIN_NAME);
    const accessory = new this.api.platformAccessory(tvName, uuid);
    new TelevisionAccessory(this, accessory, this.config);
    this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
  }
}
