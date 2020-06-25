'use strict';

/*
 * Created with @iobroker/create-adapter v1.25.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
const suncalc = require("suncalc2");
const schedule = require('node-schedule');
let lat, long, azimuth, altitude;


class Followthesun extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'followthesun',
        });
        this.on('ready', this.onReady.bind(this));
        //this.on('objectChange', this.onObjectChange.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here

      /*  await this.setObjectNotExistsAsync ('altitude', {
            type: 'state',
            common: {
                name: 'Current altitude of the sun',
                type: 'number',
                role: 'indicator',
                unit: '°',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync('azimuth', {
            type: 'state',
            common: {
                name: 'Current azimuth of the sun',
                type: 'number',
                role: 'indicator',
                unit: '°',
                read: true,
                write: false,
            },
            native: {},
        }); */

        //subscribe relevant states changes
        this.subscribeStates('altitude');
        this.subscribeStates('azimuth');

        //get Geodata from Configuration
        this.getForeignObject('system.config', (err, obj) => {
            if (err || !obj) {
                this.log.info('Adapter could not read latitude/longitude from system config!');
            } else {
                lat = obj.common.latitude;
                long = obj.common.longitude;
                this.log.debug('LATITUDE from config: ' + lat);
                this.log.debug('LONGITUDE from config: ' + long);
                this.calcPosition();
            }
        });

        //get adapter configuration
        let executioninterval = parseInt(this.config.executioninterval);
        let insecond = parseInt(this.config.insecond);
        this.log.info('Execution interval is every ' + executioninterval + ' minute(s) in second ' + insecond);

        //define chron-job
        const calcPos = schedule.scheduleJob('calcPosTimer', `${insecond} */${executioninterval} * * * *`, async () => {
        this.calcPosition();
        });
    }

    async calcPosition() {
        try {
            let now = new Date(); 
            let sunpos = suncalc.getPosition(now, lat, long);
            let altitude_old = altitude;
            let azimuth_old = azimuth;
            altitude = Math.round(sunpos.altitude * 180 / Math.PI);
            azimuth = Math.round(sunpos.azimuth * 180 / Math.PI + 180);
            //this.log.debug('Altitude: ' + altitude + ' Azimuth: ' + azimuth);

            if (altitude != altitude_old || azimuth != azimuth_old) {
                await this.setStateAsync('azimuth', { val: azimuth, ack: true });
                await this.setStateAsync('altitude', { val: altitude, ack: true });
                this.log.debug('Altitude (' + altitude_old + '|' + altitude + ') and/or azimuth (' + azimuth_old + '|' + azimuth +') changed');
            } else {
                this.log.debug('Altitude (' + altitude_old + '|' + altitude + ') and azimuth (' + azimuth_old + '|' + azimuth +') did not change');
            }

        } catch (error) {
            this.log.error(error);
        }
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            this.log.info('cleaned everything up...');
            schedule.cancelJob('calcPosTimer');
            callback();
        } catch (e) {
            callback();
        }
    }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.debug(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        } else {
            // The state was deleted
            this.log.debug(`state ${id} deleted`);
        }
    }
}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Followthesun(options);
} else {
    // otherwise start the instance directly
    new Followthesun();
}
