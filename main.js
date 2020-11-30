'use strict';

/*
 * Created with @iobroker/create-adapter v1.25.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
const suncalc = require("suncalc2");

//global variables
let latitude, longitude;
let azimuth = 0;
let altitude = 0;
let polling = null;
let executioninterval=0;


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
        //this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize adapter

        //get adapter configuration
        executioninterval = parseInt(this.config.executioninterval);
        this.log.info('Calculation will be done every ' + executioninterval + ' seconds');

        //subscribe relevant states changes
        this.subscribeStates('altitude');
        this.subscribeStates('azimuth');

        //get Geodata from Configuration
        this.getForeignObject('system.config', (err, obj) => {
            if (err || !obj) {
                this.log.error('Adapter could not read latitude/longitude from system config!');
            } else {
                latitude = obj.common.latitude;
                longitude = obj.common.longitude;
                this.log.debug('LATITUDE from config: ' + latitude);
                this.log.debug('LONGITUDE from config: ' + longitude);
                //start calculation
                this.calcPosition();
            }
        });
    }

    async calcPosition() {
        try {
            let now = new Date(); 
            let sunpos = suncalc.getPosition(now, latitude, longitude);
            //store old values to compare in next calculation cycle
            let altitude_old = altitude;
            let azimuth_old = azimuth;
            //calculate
            altitude = Math.round(sunpos.altitude * 180 / Math.PI);
            azimuth = Math.round(sunpos.azimuth * 180 / Math.PI + 180);
            this.log.silly('Altitude: ' + altitude + ' Azimuth: ' + azimuth);
            //compare, if there is any change
            if (altitude != altitude_old || azimuth != azimuth_old) {
                await this.setStateAsync('azimuth', { val: azimuth, ack: true });
                await this.setStateAsync('altitude', { val: altitude, ack: true });
                this.log.debug('Altitude (' + altitude_old + '|' + altitude + ') and/or azimuth (' + azimuth_old + '|' + azimuth +') changed');
            } else {
                this.log.debug('Altitude (' + altitude_old + '|' + altitude + ') and azimuth (' + azimuth_old + '|' + azimuth +') did not change');
            }
            
            //Timmer
            (function () {if (polling) {clearTimeout(polling); polling = null;}})();
			polling = setTimeout( () => {
                this.log.debug(`New calculation triggered by polling (every ${executioninterval} seconds)`);
                this.calcPosition();
			}, executioninterval * 1000);

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
            if (polling) {
                clearTimeout(polling);
                polling = null;
            }
            this.log.info('cleaned everything up...');
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
