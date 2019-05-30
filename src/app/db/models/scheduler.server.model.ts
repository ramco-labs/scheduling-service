'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var SchedulerSchema = new Schema({
    label: { type: String },
    requestOptions: { type: Schema.Types.Mixed },
    scheduleCondition: { type: Schema.Types.Mixed },
    runCount: { type: Number },
    lastRunDate: { type: Date },
    createdDate: { type: Date },
    status: { type: String }
});

mongoose.model('Scheduler', SchedulerSchema);

var ScheduleLogSchema = new Schema({
    scheduleId: { type: String },
    log: { type: String },
    logDate: { type: Date, default: Date.now },
    statusCode: { type: String }
});

mongoose.model('ScheduleLog', ScheduleLogSchema);