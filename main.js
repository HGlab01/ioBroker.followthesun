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
const JsonExplorer = require('iobroker-jsonexplorer');
const stateAttr = require(__dirname + '/lib/stateAttr.js'); // Load attribute library  

//global variables
let latitude, longitude;
let azimuth, altitude;
let todaySolarNoonTime;
let todayNadirTime;
let polling = null;
let executioninterval = 0;
const dayToMs = 24 * 60 * 60 * 1000;

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
        JsonExplorer.init(this, stateAttr);
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize adapter
        //get adapter configuration
        this.log.info('Started with JSON-Explorer version ' + JsonExplorer.version);
        executioninterval = parseInt(this.config.executioninterval);
        if (isNaN(executioninterval) || executioninterval < 10) { executioninterval = 120 };
        this.log.info(`Sun position calculation will be done every ${executioninterval} seconds`);

        //subscribe relevant states changes
        this.subscribeStates('altitude');
        this.subscribeStates('azimuth');

        //get Geodata from configuration
        this.getForeignObject('system.config', async (err, obj) => {
            if (err || !obj) {
                this.log.error('Adapter could not read latitude/longitude from system config!');
            } else {
                latitude = parseFloat(obj.common.latitude);
                longitude = parseFloat(obj.common.longitude);
                console.log(`LATITUDE from config: ${latitude}`);
                console.log(`LONGITUDE from config: ${longitude}`);
                this.log.debug(`LATITUDE from config: ${latitude}`);
                this.log.debug(`LONGITUDE from config: ${longitude}`);
                if (!latitude || !longitude) {
                    this.log.error(`Latitude or Longitude not set in main configuration!`);
                    this.terminate ? this.terminate(utils.EXIT_CODES.INVALID_CONFIG_OBJECT) : process.exit(0);
                    return;
                }
                //start calculation
                try {
                    await this.CalcSunData();
                    await this.calcPosition();
                } catch (error) {
                    this.log.error('Error in onReady: ' + error);
                    console.error('Error in onReady: ' + error);
                    this.sendSentry(error);
                }
            }
        });

        //Daily schedule somewhen from 00:00:20 to 00:00:40
        let scheduleSeconds = Math.round(Math.random() * 20 + 20);
        this.log.info(`Daily sun parameter calculation scheduled for 00:00:${scheduleSeconds}`);

        const calcPos = schedule.scheduleJob('SunData', `${scheduleSeconds} 0 0 * * *`, async () => {
            this.log.info(`Cronjob 'Sun parameter calculation' starts`);
            this.CalcSunData();
        });
    }

    async CalcSunData() {
        try {
            this.log.debug('Run CalcSunData');
            let now = new Date();
            let thisyear = now.getFullYear();
            let nextyear = thisyear + 1;

            let startDate = new Date('2000-03-20');
            startDate.setHours(7); startDate.setMinutes(39); startDate.setSeconds(22);
            let startDateInMs = startDate.getTime();

            let spring = ((thisyear - 2000) * 365.24 + 1 / 24) * dayToMs + startDateInMs;
            let summer = ((thisyear - 2000) * 365.24 + 92.76 + 2 / 24 + Math.floor((thisyear - 2000) / 12) * 0.01) * dayToMs + startDateInMs;
            let autumn = ((thisyear - 2000) * 365.24 + 186.41 + 2 / 24 + Math.floor((thisyear - 2000) / 12) * 0.02) * dayToMs + startDateInMs;
            let winter = ((thisyear - 2000) * 365.24 + 276.26 + 1 / 24 + Math.floor((thisyear - 2000) / 12) * 0.02) * dayToMs + startDateInMs;
            let springdate_ty = new Date(spring);
            let summerdate_ty = new Date(summer);
            let autumndate_ty = new Date(autumn);
            let winterdate_ty = new Date(winter);
            spring = ((nextyear - 2000) * 365.24 + 1 / 24) * dayToMs + startDateInMs;
            summer = ((nextyear - 2000) * 365.24 + 92.76 + 2 / 24 + Math.floor((nextyear - 2000) / 12) * 0.01) * dayToMs + startDateInMs;
            autumn = ((nextyear - 2000) * 365.24 + 186.41 + 2 / 24 + Math.floor((nextyear - 2000) / 12) * 0.02) * dayToMs + startDateInMs;
            winter = ((nextyear - 2000) * 365.24 + 276.26 + 1 / 24 + Math.floor((nextyear - 2000) / 12) * 0.02) * dayToMs + startDateInMs;
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
            days['thisYear.start of spring']['date'] = new Date(springdate_ty);
            days['thisYear.start of summer'] = [];
            days['thisYear.start of summer']['date'] = new Date(summerdate_ty);
            days['thisYear.start of autumn'] = [];
            days['thisYear.start of autumn']['date'] = new Date(autumndate_ty);
            days['thisYear.start of winter'] = [];
            days['thisYear.start of winter']['date'] = new Date(winterdate_ty);

            days['nextYear.start of spring'] = [];
            days['nextYear.start of spring']['date'] = new Date(springdate_ny);
            days['nextYear.start of summer'] = [];
            days['nextYear.start of summer']['date'] = new Date(summerdate_ny);
            days['nextYear.start of autumn'] = [];
            days['nextYear.start of autumn']['date'] = new Date(autumndate_ny);
            days['nextYear.start of winter'] = [];
            days['nextYear.start of winter']['date'] = new Date(winterdate_ny);

            //let year = now.getFullYear();
            //let month = now.getMonth();
            //let day = now.getDate();
            for (let i in days) {
                if (days[i]['date'] == undefined) {
                    //day =  day + days[i]['numberdays'];
                    //days[i]['date'] = new Date(year, month, day, 12);
                    days[i]['date'] = new Date();
                    days[i]['date'].setDate(days[i]['date'].getDate() + days[i]['numberdays']);
                    days[i]['date'].setHours(12);
                    days[i]['date'].setMinutes(0);
                    days[i]['date'].setSeconds(0);
                }
                this.log.debug('Timestap used: ' + days[i]['date']);
                sunData[i] = await suncalc.getTimes(days[i]['date'], latitude, longitude);
            }
            todaySolarNoonTime = sunData['short term.today'].solarNoon;
            todayNadirTime = sunData['short term.today'].nadir;

            for (let i in sunData) {
                altitudes[i] = {};
                altitudes[i].solarnoon = Math.round((await suncalc.getPosition(sunData[i].solarNoon, latitude, longitude).altitude * 180 / Math.PI) * 10) / 10;
                altitudes[i].sunset = Math.round((await suncalc.getPosition(sunData[i].sunset, latitude, longitude).altitude * 180 / Math.PI) * 10) / 10;
                altitudes[i].sunrise = Math.round((await suncalc.getPosition(sunData[i].sunrise, latitude, longitude).altitude * 180 / Math.PI) * 10) / 10;
                altitudes[i].dawn = Math.round((await suncalc.getPosition(sunData[i].dawn, latitude, longitude).altitude * 180 / Math.PI) * 10) / 10;
                altitudes[i].dusk = Math.round((await suncalc.getPosition(sunData[i].dusk, latitude, longitude).altitude * 180 / Math.PI) * 10) / 10;

                azimuths[i] = {};
                azimuths[i].solarnoon = Math.round((await suncalc.getPosition(sunData[i].solarNoon, latitude, longitude).azimuth * 180 / Math.PI + 180) * 10) / 10;
                azimuths[i].sunset = Math.round((await suncalc.getPosition(sunData[i].sunset, latitude, longitude).azimuth * 180 / Math.PI + 180) * 10) / 10;
                azimuths[i].sunrise = Math.round((await suncalc.getPosition(sunData[i].sunrise, latitude, longitude).azimuth * 180 / Math.PI + 180) * 10) / 10;
                azimuths[i].dawn = Math.round((await suncalc.getPosition(sunData[i].dawn, latitude, longitude).azimuth * 180 / Math.PI + 180) * 10) / 10;
                azimuths[i].dusk = Math.round((await suncalc.getPosition(sunData[i].dusk, latitude, longitude).azimuth * 180 / Math.PI + 180) * 10) / 10;

                JsonExplorer.stateSetCreate(`${i}.solarnoon_time`, `solarnoon time`, sunData[i].solarNoon.getTime());
                JsonExplorer.stateSetCreate(`${i}.solarnoon_altitude`, `solarnoon altitude`, altitudes[i].solarnoon);
                JsonExplorer.stateSetCreate(`${i}.solarnoon_azimuth`, `solarnoon azimuth`, azimuths[i].solarnoon);

                JsonExplorer.stateSetCreate(`${i}.sunset_time`, `sunset time`, sunData[i].sunset.getTime());
                JsonExplorer.stateSetCreate(`${i}.sunset_altitude`, `sunset altitude`, altitudes[i].sunset);
                JsonExplorer.stateSetCreate(`${i}.sunset_azimuth`, `sunset azimuth`, azimuths[i].sunset);

                JsonExplorer.stateSetCreate(`${i}.sunrise_time`, `sunrise time`, sunData[i].sunrise.getTime());
                JsonExplorer.stateSetCreate(`${i}.sunrise_altitude`, `sunrise altitude`, altitudes[i].sunrise);
                JsonExplorer.stateSetCreate(`${i}.sunrise_azimuth`, `sunrise azimuth`, azimuths[i].sunrise);

                JsonExplorer.stateSetCreate(`${i}.dawn_time`, `dawn time`, sunData[i].dawn.getTime());
                JsonExplorer.stateSetCreate(`${i}.dawn_altitude`, `dawn altitude`, altitudes[i].dawn);
                JsonExplorer.stateSetCreate(`${i}.dawn_azimuth`, `dawn azimuth`, azimuths[i].dawn);

                JsonExplorer.stateSetCreate(`${i}.dusk_time`, `dusk time`, sunData[i].dusk.getTime());
                JsonExplorer.stateSetCreate(`${i}.dusk_azimuth`, `dusk azimuth`, azimuths[i].dusk);
                JsonExplorer.stateSetCreate(`${i}.dusk_altitude`, `dusk altitude`, altitudes[i].dusk);
            }
        } catch (error) {
            let eMsg = 'Error in CalcSunData: ' + error;
            this.log.error(eMsg);
            console.error(eMsg);
            this.sendSentry(error);
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
            altitude = Math.round((sunpos.altitude * 180 / Math.PI) * 10) / 10;
            azimuth = Math.round((sunpos.azimuth * 180 / Math.PI + 180) * 10) / 10;
            this.log.silly('Altitude: ' + altitude + ' Azimuth: ' + azimuth);
            //compare, if there is any change
            if (altitude != altitude_old || azimuth != azimuth_old) {
                this.log.debug('Altitude (' + altitude_old + '|' + altitude + ') and/or azimuth (' + azimuth_old + '|' + azimuth + ') changed');
                this.calcAdditionalInfo(altitude, azimuth, altitude_old, azimuth_old)
            } else {
                this.log.debug('Altitude (' + altitude_old + '|' + altitude + ') and azimuth (' + azimuth_old + '|' + azimuth + ') did not change');
            }
            //Timmer
            (function () { if (polling) { clearTimeout(polling); polling = null; } })();
            polling = setTimeout(() => {
                this.log.debug(`New calculation triggered by polling (every ${executioninterval} seconds)`);
                this.calcPosition();
            }, executioninterval * 1000);

        } catch (error) {
            let eMsg = 'Error in calcPosition: ' + error;
            this.log.error(eMsg);
            console.error(eMsg);
            this.sendSentry(error);
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
        let sunPositon = await windrose.getPoint(azimuth, { depth: 2 }).symbol;
        JsonExplorer.stateSetCreate(`current.azimuth`, `current azimuth`, azimuth);
        JsonExplorer.stateSetCreate(`current.altitude`, `current altitude`, altitude);
        JsonExplorer.stateSetCreate(`current.compass_direction`, `compass direction`, sunPositon);
        this.log.debug(`Sunposition is '${sunPositon}'`);

        let NowInMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
        let SolarNoonInMinutes = todaySolarNoonTime.getHours() * 60 + todaySolarNoonTime.getMinutes() + todaySolarNoonTime.getSeconds() / 60;
        let NadirInMinutes = todayNadirTime.getHours() * 60 + todayNadirTime.getMinutes() + todayNadirTime.getSeconds() / 60;

        this.log.silly(`NowInMinutes: ${NowInMinutes}`);
        this.log.silly(`SolarNoonInMinutes: ${SolarNoonInMinutes}`);
        this.log.silly(`NadirInMinutes: ${NadirInMinutes}`);

        if (NadirInMinutes < 720) { //Sun is in the lowest position after midnight
            this.log.silly(`Sun is in the lowest position after midnight`);
            if (NowInMinutes > NadirInMinutes && NowInMinutes < SolarNoonInMinutes) {
                JsonExplorer.stateSetCreate(`current.movement`, `movement`, 'sunrise');
                this.log.debug(`Movement is 'Sunrise'`);
            } else {
                JsonExplorer.stateSetCreate(`current.movement`, `movement`, 'sunset');
                this.log.debug(`Movement is 'Sunset'`);
            }
        }
        else { //Sun is in the lowest position before midnight
            this.log.silly(`Sun is in the lowest position before midnight`);
            if ((NowInMinutes > NadirInMinutes || NowInMinutes > 0) && (NowInMinutes < SolarNoonInMinutes)) {
                JsonExplorer.stateSetCreate(`current.movement`, `movement`, 'sunrise');
                this.log.debug(`Movement is 'Sunrise'`);
            } else {
                JsonExplorer.stateSetCreate(`current.movement`, `movement`, 'sunset');
                this.log.debug(`Movement is 'Sunset'`);
            }
        }

        JsonExplorer.stateSetCreate(`current.lastupdate`, `last update`, now.getTime());
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

    /**
     * @param {any} errorObject
     */
    sendSentry(errorObject) {
        try {
            if (this.supportsFeature && this.supportsFeature('PLUGINS')) {
                const sentryInstance = this.getPluginInstance('sentry');
                if (sentryInstance) {
                    sentryInstance.getSentryObject().captureException(errorObject);
                }
            }
        } catch (error) {
            this.log.error(`Error in function sendSentry(): ${error}`);
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
