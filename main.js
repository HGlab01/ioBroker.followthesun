'use strict';

/*
 * Created with @iobroker/create-adapter v1.25.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
const suncalc = require('suncalc2');
const windrose = require('windrose');
const schedule = require('node-schedule');

//global variables
let latitude, longitude;
let azimuth, altitude;
let todaySolarNoonTime;
let todayNadirTime;
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
        if (isNaN(executioninterval)) { executioninterval = 120}
        this.log.info('Calculation will be done every ' + executioninterval + ' seconds');

        //subscribe relevant states changes
        this.subscribeStates('altitude');
        this.subscribeStates('azimuth');

        //get Geodata from configuration
        this.getForeignObject('system.config', async (err, obj) => {
            if (err || !obj) {
                this.log.error('Adapter could not read latitude/longitude from system config!');
            } else {
                latitude = obj.common.latitude;
                longitude = obj.common.longitude;
                this.log.debug('LATITUDE from config: ' + latitude);
                this.log.debug('LONGITUDE from config: ' + longitude);
                //start calculation
                await this.CalcSunData();
                await this.calcPosition();
            }
        });

        //starts every day at 00:00:44
        const calcPos = schedule.scheduleJob('SunData', `44 0 0 * * *`, async () => {
            this.log.info(`Cronjob 'SunData' startet`);
            this.CalcSunData();
        });
    }

    async CalcSunData() {
        try {
            this.log.debug('Run CalcSunData');
            let now = new Date();
            let thisyear = now.getFullYear();
            let nextyear = thisyear + 1;
            
            let startDate = new Date ('2000-03-20');
            startDate.setHours(7); startDate.setMinutes(39); startDate.setSeconds(22);
            let startDateInMs = startDate.getTime();

            const dayToMs = 24*60*60*1000;
            let spring = ((thisyear - 2000) * 365.24 + 1/24) * dayToMs + startDateInMs;
            let summer = ((thisyear - 2000) * 365.24 + 92.76 + 2/24 + Math.floor((thisyear-2000)/12)*0.01) * dayToMs + startDateInMs;
            let autumn = ((thisyear - 2000) * 365.24 + 186.41 + 2/24 + Math.floor((thisyear-2000)/12)*0.02) * dayToMs + startDateInMs;
            let winter = ((thisyear - 2000) * 365.24 + 276.26 + 1/24 + Math.floor((thisyear-2000)/12)*0.02) * dayToMs + startDateInMs;
            let springdate_ty = new Date(spring);
            let summerdate_ty = new Date(summer);
            let autumndate_ty = new Date(autumn);
            let winterdate_ty = new Date(winter);
            spring = ((nextyear - 2000) * 365.24 + 1/24) * dayToMs + startDateInMs;
            summer = ((nextyear - 2000) * 365.24 + 92.76 + 2/24 + Math.floor((nextyear-2000)/12)*0.01) * dayToMs + startDateInMs;
            autumn = ((nextyear - 2000) * 365.24 + 186.41 + 2/24 + Math.floor((nextyear-2000)/12)*0.02) * dayToMs + startDateInMs;
            winter = ((nextyear - 2000) * 365.24 + 276.26 + 1/24 + Math.floor((nextyear-2000)/12)*0.02) * dayToMs + startDateInMs;
            let springdate_ny = new Date(spring);
            let summerdate_ny = new Date(summer);
            let autumndate_ny = new Date(autumn);
            let winterdate_ny = new Date(winter);

            let days = [];
            let sunData = [];
            let altitudes = [];
            let azimuths = [];
            
            days['short term.today'] = [];
            days['short term.today']['numberdays'] = 0; 
            days['short term.yesterday'] = [];
            days['short term.yesterday']['numberdays'] = -1;
            days['short term.tomorrow'] = [];
            days['short term.tomorrow']['numberdays'] = +1;
            days['short term.in one week'] = [];
            days['short term.in one week']['numberdays'] = +7;

            days['thisYear.start of spring'] = [];
            days['thisYear.start of spring']['date'] = new Date (springdate_ty); 
            days['thisYear.start of summer'] = [];
            days['thisYear.start of summer']['date'] = new Date(summerdate_ty);
            days['thisYear.start of autumn'] = [];
            days['thisYear.start of autumn']['date'] = new Date (autumndate_ty); 
            days['thisYear.start of winter'] = [];
            days['thisYear.start of winter']['date'] = new Date(winterdate_ty);

            days['nextYear.start of spring'] = [];
            days['nextYear.start of spring']['date'] = new Date (springdate_ny); 
            days['nextYear.start of summer'] = [];
            days['nextYear.start of summer']['date'] = new Date(summerdate_ny);
            days['nextYear.start of autumn'] = [];
            days['nextYear.start of autumn']['date'] = new Date (autumndate_ny); 
            days['nextYear.start of winter'] = [];
            days['nextYear.start of winter']['date'] = new Date(winterdate_ny);

            for (let i in days) {
                if (days[i]['date'] == undefined) {
                    days[i]['date'] = new Date();
                    days[i]['date'].setDate(days[i]['date'].getDate() + days[i]['numberdays']);
                }
                //this.log.info(days[i]['date']);
                sunData[i] = await suncalc.getTimes(days[i]['date'], latitude, longitude);
                // @ts-ignore
                await this.setObjectNotExistsAsync([i] + '.solarnoon_time', {
                    "type": "state", common: {name: 'solarnoon time', "role": "value.time"}, native: {},
                });
                // @ts-ignore
                await this.setObjectNotExistsAsync([i] + '.solarnoon_altitude', {
                    "type": "state", common: {name: 'solarnoon altitude', "role": "value", "unit": "°"}, native: {},
                });
                // @ts-ignore
                await this.setObjectNotExistsAsync([i] + '.solarnoon_azimuth', {
                    "type": "state", common: {name: 'solarnoon azimuth', "role": "value", "unit": "°"}, native: {},
				});
            }
            todaySolarNoonTime = sunData['short term.today'].solarNoon;
            todayNadirTime = sunData['short term.today'].nadir;
            
            for (let i in sunData) {
                altitudes[i] = {};
                altitudes[i].solarnoon = Math.round((await suncalc.getPosition(sunData[i].solarNoon, latitude, longitude).altitude * 180 / Math.PI)*10)/10;
                azimuths[i] = {};
                azimuths[i].solarnoon = Math.round((await suncalc.getPosition(sunData[i].solarNoon, latitude, longitude).azimuth * 180 / Math.PI +180)*10)/10;
                this.setStateAsync(`${i}.solarnoon_time`, { val: sunData[i].solarNoon, ack: true });
                this.setStateAsync(`${i}.solarnoon_altitude`, { val: altitudes[i].solarnoon, ack: true });
                this.setStateAsync(`${i}.solarnoon_azimuth`, { val: azimuths[i].solarnoon, ack: true });
            }         
        } catch (error) {
            this.log.error(error);
        }
    }

    async calcPosition() {
        try {
            this.log.debug('Run calcPosition');
            let now = new Date();
            let sunpos = await suncalc.getPosition(now, latitude, longitude);
            //store old values to compare in next calculation cycle
            let altitude_old = altitude;
            let azimuth_old = azimuth;
            //calculate
            altitude = Math.round((sunpos.altitude * 180 / Math.PI)*10)/10;
            azimuth = Math.round((sunpos.azimuth * 180 / Math.PI + 180)*10)/10;
            this.log.silly('Altitude: ' + altitude + ' Azimuth: ' + azimuth);
            //compare, if there is any change
            if (altitude != altitude_old || azimuth != azimuth_old) {
                this.log.debug('Altitude (' + altitude_old + '|' + altitude + ') and/or azimuth (' + azimuth_old + '|' + azimuth +') changed');
                this.calcAdditionalInfo(altitude, azimuth, altitude_old, azimuth_old)
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
     * @param {number} altitude - after last change
     * @param {number} azimuth - after last change
     * @param {number} altitude_old - before last change
     * @param {number} azimuth_old - before last change
     */
    async calcAdditionalInfo(altitude, azimuth, altitude_old, azimuth_old) {
        let now = new Date();
        let sunPositon = await windrose.getPoint(azimuth,{depth:2}).symbol;
        this.setStateAsync('current.azimuth', { val: azimuth, ack: true });
        this.setStateAsync('current.altitude', { val: altitude, ack: true });
        this.setStateAsync('current.compass_direction', { val: sunPositon, ack: true });
        this.log.debug(`Sunposition is ${sunPositon}`);

        let NowInMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
        let SolarNoonInMinutes = todaySolarNoonTime.getHours() * 60 + todaySolarNoonTime.getMinutes() + todaySolarNoonTime.getSeconds() / 60;
        let NadirInMinutes = todayNadirTime.getHours() * 60 + todayNadirTime.getMinutes() + todayNadirTime.getSeconds() / 60;

        this.log.debug(`NowInMinutes: ${NowInMinutes}`);
        this.log.debug(`SolarNoonInMinutes: ${SolarNoonInMinutes}`);
        this.log.debug(`NadirInMinutes: ${NadirInMinutes}`);

        if (NadirInMinutes < 180) { //Sun is in the lowest position after midnight
            this.log.debug(`Sun is in the lowest position after midnight`);
            if (NowInMinutes > NadirInMinutes && NowInMinutes < SolarNoonInMinutes) {
                this.setStateAsync('current.movement', { val: 'sunrise', ack: true });
                this.log.debug(`Sunrise set`);
            } else {
                this.setStateAsync('current.movement', { val: 'sunset', ack: true });
                this.log.debug(`Sunset set`);
            }
        }
        else { //Sun is in the lowest position before midnight
            this.log.debug(`Sun is in the lowest position before midnight`);
            if ((NowInMinutes > NadirInMinutes || NowInMinutes > 0) && (NowInMinutes < SolarNoonInMinutes)) {
                this.setStateAsync('current.movement', { val: 'sunrise', ack: true });
                this.log.debug(`Sunrise set`);
            } else {
                this.setStateAsync('current.movement', { val: 'sunset', ack: true });
                this.log.debug(`Sunset set`);
            }
        }

        this.setStateAsync('current.lastupdate', { val: now, ack: true });
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            schedule.cancelJob('SunData');
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
