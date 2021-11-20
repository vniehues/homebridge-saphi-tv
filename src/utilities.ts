import { Configuration } from './configuration';
import { SaphiTvPlatform } from './platform';
import wol from 'wake_on_lan';
import Response from 'fetch-timeout';
import fetchTimeout from 'fetch-timeout';

export class Utilities {
  constructor(public readonly config: Configuration, public readonly platform: SaphiTvPlatform) {
  }

  async GET(url: string): Promise<Response> {
    return await fetchTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, this.config.timeout, 'Timeout Error')
      .catch(err => { 
        this.platform.log.debug('Error', err);
      });
  }

  async POST(url: string, body: unknown): Promise<Response> {
    return await fetchTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }, this.config.timeout, 'Timeout Error').catch(err => {
      this.platform.log.debug('Error', err);
    });
  }

  waitFor(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  wolRequest(url) {
    return new Promise(() => {
      this.platform.log.debug('calling WOL with URL %s', url);
      if (!url) {
        this.platform.log.warn('WOL-Error: ', 'No WOL-Address given.');
        return;
      }
      if (url.substring(0, 3).toUpperCase() === 'WOL') {
        //Wake on lan request
        const macAddress = url.replace(/^WOL[:]?[/]?[/]?/gi, '');
        this.platform.log.debug('Executing WakeOnLan request to ' + macAddress);

        wol.wake(macAddress, { num_packets: 20 }, (error) => {
          if (error) {
            this.platform.log.warn('WOL-Error: ', error);
          } else {
            this.platform.log.info('WOL-OK!');
          }
        });
      } else {
        if (url.length > 3) {
          this.platform.log.warn('WOL-Error: ', 
            'The given WOL-Address does not have the correct format. Please double check your configuration');
        } else {
          this.platform.log.warn('WOL-Error: ', 'No WOL-Address given.');
        }
      }
    },
    );
  }
}