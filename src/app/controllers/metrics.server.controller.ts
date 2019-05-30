// let config = require('../../config/config');
const client = require('prom-client');

const collectDefaultMetrics = client.collectDefaultMetrics;
const register = new client.Registry();

/**
 * COLLECT DEFAULT METRICS FOR THE PROCESS
 * https://prometheus.io/docs/instrumenting/writing_clientlibs/#standard-and-runtime-collectors
 */

collectDefaultMetrics({
    timeout: 5000,
    register: register
});

/**
 * METRIC DEFINITIONS
 */

const registerScheduleCount = new client.Counter({
    name: 'registerScheduleCount',
    help: 'count of registered schedules',
    labelNames: ['registerScheduleCount'],
    registers: [register]
});
const scheduleFailureCount = new client.Counter({
    name: 'scheduleFailureCount',
    help: 'count of failed schedules',
    labelNames: ['id'],
    registers: [register]
});
const scheduleTotalCount = new client.Counter({
    name: 'scheduleTotalCount',
    help: 'count of total schedules',
    labelNames: ['id'],
    registers: [register]
});
const removeScheduleCount = new client.Counter({
    name: 'removeScheduleCount',
    help: 'count of removed schedules',
    labelNames: ['removeScheduleCount'],
    registers: [register]
});
const viewScheduleCount = new client.Counter({
    name: 'viewScheduleCount',
    help: 'count of schedules viewed',
    labelNames: ['viewScheduleCount'],
    registers: [register]
});
const updateScheduleCount = new client.Counter({
    name: 'updateScheduleCount',
    help: 'count of updated schedules',
    labelNames: ['updateScheduleCount'],
    registers: [register]
});
const startScheduleCount = new client.Counter({
    name: 'startScheduleCount',
    help: 'count of started schedules',
    labelNames: ['startScheduleCount'],
    registers: [register]
});

export const registerScheduleCounter = function () {
    registerScheduleCount.inc({
        registerScheduleCount: 'Total Number Of predict request calls made'
    });
};
export const scheduleFailureCounter = function (id) {
    scheduleFailureCount.inc({id:id});
};
export const scheduleTotalCounter = function (id) {
    scheduleTotalCount.inc({id:id});
};
export const removeScheduleCounter = function () {
    removeScheduleCount.inc({
        removeScheduleCount: 'Total Number Of predict request calls made'
    });
};
export const viewScheduleCounter = function () {
    viewScheduleCount.inc({
        viewScheduleCount: 'Total Number Of predict request calls made'
    });
};
export const updateScheduleCounter = function () {
    updateScheduleCount.inc({
        updateScheduleCount: 'Total Number Of predict request calls made'
    });
};
export const startScheduleCounter = function () {
    startScheduleCount.inc({
        startScheduleCount: 'Total Number Of predict request calls made'
    });
};

const mergedRegistries = client.Registry.merge([register, client.register]);

export const getMetrics = function (req, res) {
    res.set('Content-Type', mergedRegistries.contentType);
    res.end(mergedRegistries.metrics());
};