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
        this.on('objectChange', this.onObjectChange.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
        //this.lat = 0;
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here

        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:
        //this.log.info('config option1: ' + this.config.option1);
        //this.log.info('config option2: ' + this.config.option2);


        /*
        For every state in the system there has to be also an object of type state
        Here a simple template for a boolean variable named "testVariable"
        Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
        */
        /*await this.setObjectAsync('testVariable', {
            type: 'state',
            common: {
                name: 'testVariable',
                type: 'boolean',
                role: 'indicator',
                read: true,
                write: true,
            },
            native: {},
        });*/

        await this.setObjectAsync('altitude', {
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

        await this.setObjectAsync('azimuth', {
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
        });

        // in this template all states changes inside the adapters namespace are subscribed
        this.subscribeStates('*');

        /*
        setState examples
        you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
        */
        // the variable testVariable is set to true as command (ack=false)
        //await this.setStateAsync('testVariable', true);

        // same thing, but the value is flagged "ack"
        // ack should be always set to true if the value is received from or acknowledged from the target system
        //await this.setStateAsync('testVariable', { val: true, ack: true });

        // same thing, but the state is deleted after 30s (getState will return null afterwards)
        //await this.setStateAsync('testVariable', { val: true, ack: true, expire: 30 });

        // examples for the checkPassword/checkGroup functions
        //let result = await this.checkPasswordAsync('admin', 'iobroker');
        //this.log.info('check user admin pw iobroker: ' + result);

        //result = await this.checkGroupAsync('admin', 'admin');
        //this.log.info('check group user admin group admin: ' + result);


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
        let executioninterval = this.config.option1;
        let insecond = this.config.option2;
        this.log.info('Polling time is every ' + executioninterval + ' minute(s) in second ' + insecond)
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
            azimuth = Math.round(sunpos.azimuth * 180 / Math.PI + 000);
            //this.log.debug('Altitude: ' + altitude + ' Azimuth: ' + azimuth);

            if (altitude != altitude_old || azimuth != azimuth_old) {
                await this.setStateAsync('azimuth', { val: azimuth, ack: true });
                await this.setStateAsync('altitude', { val: altitude, ack: true });
                this.log.debug('Altitude (' + altitude_old + '|' + altitude + ') or azimuth (' + azimuth_old + '|' + azimuth +') changed');
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
            callback();
        } catch (e) {
            callback();
        }
    }

    /**
     * Is called if a subscribed object changes
     * @param {string} id
     * @param {ioBroker.Object | null | undefined} obj
     */
    onObjectChange(id, obj) {
        if (obj) {
            // The object was changed
            this.log.debug(`object ${id} changed: ${JSON.stringify(obj)}`);
        } else {
            // The object was deleted
            this.log.debug(`object ${id} deleted`);
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

    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.message" property to be set to true in io-package.json
    //  * @param {ioBroker.Message} obj
    //  */
    // onMessage(obj) {
    // 	if (typeof obj === 'object' && obj.message) {
    // 		if (obj.command === 'send') {
    // 			// e.g. send email or pushover or whatever
    // 			this.log.info('send command');

    // 			// Send response in callback if required
    // 			if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
    // 		}
    // 	}
    // }

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
