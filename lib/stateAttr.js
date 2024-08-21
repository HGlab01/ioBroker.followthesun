/**
 * ************************************************************
 * *************** state attribute template  ******************
 * *** state attribute template by HGlab01 & DutchmanNL ***
 * ************************************************************
 * Object definitions can contain these elements to be called by stateSetCreate function, if not set default values are used
 'Cancel current printing': {			// id of state (name) submitted by stateSetCreate function
        root: '_Info',						// {default: NotUsed} Upper channel root
        rootName: 'Device Info channel,		// {default: NotUsed} Upper channel name
        name: 'Name of state',				// {default: same as id} Name definition for object
        type: >typeof (value)<,				// {default: typeof (value)} type of value automatically detected
        read: true,							// {default: true} Name defition for object
        write: true,						// {default: false} Name defition for object
        role: 'indicator.info',				// {default: state} Role as defined by https://github.com/ioBroker/ioBroker/blob/master/doc/STATE_ROLES.md
        modify: ''							// {default: ''} see below
    },
 */

/**
 * Defines supported methods for element modify which can be used in stateAttr.js
 * In addition: 'cumstom: YOUR CALCULATION' allows any calculation, where 'value' is the input parameter.
 * Example:
 * modify: 'custom: value + 1' --> add 1 to the json-input
 *
 *  * supported methods (as string):
 *  - round(number_of_digits as {number})  //integer only
 * 	- multiply(factor as {number})
 *  - divide(factor as {number})
 *  - add(number {number})
 *  - substract(number {number})
 *  - upperCase
 *  - lowerCase
 *  - ucFirst
 *
 * Examples for usage of embeded methods:
 * modify: ['multiply(3.6)', 'round(2)'] --> defined as array --> multiplied by 3.6 and then the result is rounded by 2 digits
 * modify: 'upperCase' --> no array needed as there is only one action; this uppercases the string
 *
 */

/**
 * state attribute definitions
 */
const stateAttrb = {
    'dusk time': {
        name: {
            en: 'Dusk time',
            de: 'Abenddämmerung'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.time',
        unit: ''
    },
    'dusk altitude': {
        name: {
            en: 'Dusk altitude',
            de: 'Höhe der Abenddämmerung'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.sun.elevation',
        unit: '°'
    },
    'dusk azimuth': {
        name: {
            en: 'Dusk azimuth',
            de: 'Azimut der Dämmerung'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.sun.azimuth',
        unit: '°'
    },
    'dawn time': {
        name: {
            en: 'Dawn time',
            de: 'Morgendämmerung'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.time',
        unit: ''
    },
    'dawn altitude': {
        name: {
            en: 'Dawn altitude',
            de: 'Höhe der Morgendämmerung'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.sun.elevation',
        unit: '°'
    },
    'dawn azimuth': {
        name: {
            en: 'Dawn azimuth',
            de: 'Azimut der Morgendämmerung'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.sun.azimuth',
        unit: '°'
    },
    'sunrise time': {
        name: {
            en: 'Sunrise time',
            de: 'Sonnenaufgang'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.time',
        unit: ''
    },
    'sunrise altitude': {
        name: {
            en: 'Sunrise altitude',
            de: 'Höhe des Sonnenaufgangs'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.sun.elevation',
        unit: '°'
    },
    'sunrise azimuth': {
        name: {
            en: 'Sunrise azimuth',
            de: 'Azimut des Sonnenaufgangs'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.sun.azimuth',
        unit: '°'
    },
    'sunset time': {
        name: {
            en: 'Sunset time',
            de: 'Sonnenuntergang'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.time',
        unit: ''
    },
    'sunset altitude': {
        name: {
            en: 'Sunset altitude',
            de: 'Höhe des Sonnenuntergangs'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.sun.elevation',
        unit: '°'
    },
    'sunset azimuth': {
        name: {
            en: 'Sunset azimuth',
            de: 'Azimut des Sonnenuntergangs'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.sun.azimuth',
        unit: '°'
    },
    'solarnoon time': {
        name: {
            en: 'Solarnoon time',
            de: 'Sonnenmittag'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.time',
        unit: ''
    },
    'solarnoon altitude': {
        name: {
            en: 'Solarnoon altitude',
            de: 'Höhe des Sonnenmittags'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.sun.elevation',
        unit: '°'
    },
    'solarnoon azimuth': {
        name: {
            en: 'Solarnoon azimuth',
            de: 'Azimut des Sonnenmittags'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.sun.azimuth',
        unit: '°'
    },
    'current azimuth': {
        name: {
            en: 'Current azimuth of the sun',
            de: 'Aktueller Azimut des Sonnenstandes'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.sun.azimuth',
        unit: '°'
    },
    'current altitude': {
        name: {
            en: 'Current altitude of the sun',
            de: 'Aktuelle Höhe des Sonnenstandes'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.sun.elevation',
        unit: '°'
    },
    'compass direction': {
        name: {
            en: 'Current compass direction of the sun',
            de: 'Aktuelle Kompassrichtung des Sonnenstandes'
        },
        type: 'string',
        read: true,
        write: false,
        role: 'value.direction',
        unit: ''
    },
    'last update': {
        name: {
            en: 'Last update',
            de: 'Letzte Aktualisierung'
        },
        type: 'number',
        read: true,
        write: false,
        role: 'value.time',
        unit: ''
    },
    'movement': {
        name: {
            en: 'Current movement of the sun',
            de: 'Aktuelle Bewegung des Sonnenstandes'
        },
        type: 'string',
        read: true,
        write: false,
        role: 'state',
        unit: ''
    },
};

module.exports = stateAttrb;
