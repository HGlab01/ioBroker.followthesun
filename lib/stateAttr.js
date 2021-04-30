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
        name: 'dusk time',
        type: 'number',
        read: true,
        write: false,
        role: 'value.time',
        unit: ''
    },
    'dusk altitude': {
        name: 'dusk altitude',
        type: 'number',
        read: true,
        write: false,
        role: 'value',
        unit: '°'
    },
    'dusk azimuth': {
        name: 'dusk azimuth',
        type: 'number',
        read: true,
        write: false,
        role: 'value',
        unit: '°'
    },
    'dawn time': {
        name: 'dawn time',
        type: 'number',
        read: true,
        write: false,
        role: 'value.time',
        unit: ''
    },
    'dawn altitude': {
        name: 'dawn altitude',
        type: 'number',
        read: true,
        write: false,
        role: 'value',
        unit: '°'
    },
    'dawn azimuth': {
        name: 'dawn azimuth',
        type: 'number',
        read: true,
        write: false,
        role: 'value',
        unit: '°'
    },
    'sunrise time': {
        name: 'sunrise time',
        type: 'number',
        read: true,
        write: false,
        role: 'value.time',
        unit: ''
    },
    'sunrise altitude': {
        name: 'sunrise altitude',
        type: 'number',
        read: true,
        write: false,
        role: 'value',
        unit: '°'
    },
    'sunrise azimuth': {
        name: 'sunrise azimuth',
        type: 'number',
        read: true,
        write: false,
        role: 'value',
        unit: '°'
    },
    'sunset time': {
        name: 'sunset time',
        type: 'number',
        read: true,
        write: false,
        role: 'value.time',
        unit: ''
    },
    'sunset altitude': {
        name: 'sunset altitude',
        type: 'number',
        read: true,
        write: false,
        role: 'value',
        unit: '°'
    },
    'sunset azimuth': {
        name: 'sunset azimuth',
        type: 'number',
        read: true,
        write: false,
        role: 'value',
        unit: '°'
    },
    'solarnoon time': {
        name: 'solarnoon time',
        type: 'number',
        read: true,
        write: false,
        role: 'value.time',
        unit: ''
    },
    'solarnoon altitude': {
        name: 'solarnoon altitude',
        type: 'number',
        read: true,
        write: false,
        role: 'value',
        unit: '°'
    },
    'solarnoon azimuth': {
        name: 'solarnoon azimuth',
        type: 'number',
        read: true,
        write: false,
        role: 'value',
        unit: '°'
    },
    'current azimuth': {
        name: 'current azimuth of the sun',
        type: 'number',
        read: true,
        write: false,
        role: 'value',
        unit: '°'
    },
    'current altitude': {
        name: 'current altitude of the sun',
        type: 'number',
        read: true,
        write: false,
        role: 'value',
        unit: '°'
    },
    'compass direction': {
        name: 'current compass direction of the sun',
        type: 'string',
        read: true,
        write: false,
        role: 'value',
        unit: ''
    },
    'last update': {
        name: 'last update',
        type: 'number',
        read: true,
        write: false,
        role: 'value.time',
        unit: ''
    },
    'movement': {
        name: 'current movement of the sun',
        type: 'string',
        read: true,
        write: false,
        role: 'value',
        unit: ''
    },
};

module.exports = stateAttrb;
