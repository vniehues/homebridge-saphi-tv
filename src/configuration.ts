import { PlatformConfig } from 'homebridge';
import { Input } from './input';

export class Configuration {
    ip_address: string;
    wol_url: string;
    ambi_poweron: boolean;
    ambi_poweroff: boolean;
    inputs: Input[];
    name: string;
    startup_time: number;
    input_delay: number;
    timeout: number;
    polling_interval: number;
    protocol: string;
    api_version: number;
    port_no: number;
    has_tv_channels: boolean;
    channel_setup_popup_time: number;
    has_ambihue: boolean;
    has_ambilight: boolean;
    input_url: string;
    ambihue_url: string;
    power_url: string;
    ambilight_url: string;
  audio_url: string;
  base_url: string;

  constructor(public readonly config: PlatformConfig) {
    // required properties
    this.ip_address = config.ip_adress as string;
    this.wol_url = config.wol_adress as string;
    this.inputs = config.inputs as [];
    this.name = config.name as string;

    if(!this.wol_url.startsWith('wol://')) {
      this.wol_url = 'wol://'+this.wol_url;
    }

    // timings
    this.polling_interval = config.polling_interval as number * 1000 || 30000;
    this.startup_time = config.startup_time as number * 1000 || 15000;
    this.timeout = config.timeout as number * 1000 || 5000;
    this.channel_setup_popup_time = config.channel_setup_popup_time as number || 2250;
    this.input_delay = config.input_delay as number || 650;

    // api settings
    this.protocol = config.protocol as string || 'http';
    this.port_no = config.api_port_no as number || 1925;
    this.api_version = config.api_version as number || 6;

    // capabilities
    this.has_ambihue = config.has_ambihue as boolean;
    this.has_ambilight = config.has_ambilight as boolean;
    this.ambi_poweron = config.ambi_poweron as boolean || false;
    this.ambi_poweroff = config.ambi_poweroff as boolean || false;

    // tv settings
    this.has_tv_channels = !config.has_tv_channels as boolean || true;

    // urls
    this.base_url = this.protocol + '://' + this.ip_address + ':' + this.port_no + '/' + this.api_version;

    this.power_url = this.base_url + '/powerstate';
    this.ambihue_url = this.base_url + '/HueLamp/power';
    this.ambilight_url = this.base_url + '/ambilight/power';
    this.input_url = this.base_url + '/input/key';
    this.audio_url = this.base_url + '/audio/volume';

    if (this.has_ambilight === false) {
      this.has_ambihue = false;
    }
    if(this.has_ambihue === false) {
      this.ambi_poweron = false;
      this.ambi_poweroff = false;
    }
      
    // keep timings in range
    if (this.startup_time < 5 * 1000 || typeof this.startup_time !== 'number' || isNaN(this.startup_time)) {
      this.startup_time = 10 * 1000;
    }
    if (this.polling_interval < 15 * 1000 || typeof this.polling_interval !== 'number' || isNaN(this.polling_interval)) {
      this.polling_interval = 30 * 1000;
    }
    if (this.input_delay < 150 || typeof this.input_delay !== 'number' || isNaN(this.input_delay)) {
      this.input_delay = 600;
    }
    if (this.timeout < 2 * 1000 || typeof this.timeout !== 'number' || isNaN(this.timeout)) {
      this.timeout = 5 * 1000;
    }
  }
}