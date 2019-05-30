// import * as metrics from './../controllers/metrics.server.controller';
var config = require('../../config/config');
import { log } from '../utils/error.utils';
import * as initTracer from './../utils/tracing.utils';
const { FORMAT_HTTP_HEADERS } = require('opentracing');

var mongoose = require('mongoose'),
    schedule = require('node-schedule'),
    axios = require("axios");

var Scheduler = mongoose.model('Scheduler'),
    ScheduleLog = mongoose.model('ScheduleLog');

global["scheduleObj"] = {};

var apiCallFunc = async function (doc,span) {
    let apiCallSpan = global[ "tracer" ].startSpan("api-call", { childOf: span });

    try {
        if(!doc["requestOptions"]["headers"]){
            doc["requestOptions"]["headers"] = {};
        }

        console.log("headers--------", doc["requestOptions"]["headers"]);
        
      global[ "tracer" ].inject(span, FORMAT_HTTP_HEADERS, doc["requestOptions"]["headers"]);

        log('info', {
            message: "Running schedule.. ",
            requestOptions: doc["requestOptions"]
        }, span);

        let response = await axios(doc["requestOptions"]);

        var schedulelog = new ScheduleLog({
            scheduleId: doc["_id"],
            logDate: new Date(),
            statusCode: response.status
        });
        
        schedulelog.save(function (err, logdoc) {
            if (err) {
                log('error', {
                    message: "An error occured in running the schedule ",
                    doc: doc['_id']
                }, span);
            } else {
                log('info', {
                    message: "Schedule",
                    doc: doc["_id"],
                    ranSuccessfullyAt: new Date().toISOString(),
                    logId: logdoc["_id"]
                }, span);
            }
        });
        apiCallSpan.finish();

    } catch (err) {

        console.log(`---------Error in Running Schedule ${err}`);

        let status;

        if (err.response) {
            status = err.response.status;
        } else {
            status = err.request.status;
        }

        log('error', {
            message: "An error occured in running the schedule!",
            id: doc["_id"],
            status: status
        }, span);

        // metrics.scheduleFailureCounter(doc["_id"]);
        var schedulelog = new ScheduleLog({
            scheduleId: doc["_id"],
            logDate: new Date(),
            statusCode: status
        });

        schedulelog.save(function (err, logdoc) {

            if (err) {
                log('error', {
                    message: "An error occured in running the schedule ",
                    doc: doc["_id"]
                }, span);
            } else {
                log('info', {
                    Schedule: doc["_id"],
                    ranSuccessfullyAt: new Date().toISOString(),
                    logId: logdoc["_id"]
                }, span);
            }

        });
    }
    apiCallSpan.finish();
};

var scheduleJob = async function (doc, span) {

    log('info', {
        message: "Scheduling Job ID",
        doc: doc["_id"],
        condition: doc["scheduleCondition"]
    }, span);

    global["scheduleObj"][doc["_id"]] = schedule.scheduleJob(doc["scheduleCondition"], function () {

        const scheduleSpan = global[ "tracer" ].startSpan("scheduled-run");

        // metrics.scheduleTotalCounter(doc["_id"]);

        let uid;

        if (doc["requestOptions"]["data"] && doc["requestOptions"]["data"]["uid"]) {
            uid = doc["requestOptions"]["data"]["uid"];
        } else {
            uid = "NA";
        }

        log('info', {
            message: "Running schedule" ,
            doc: doc['_id'],
            url: doc["requestOptions"]["url"],
            data: doc["requestOptions"]["data"],
            uid: uid
        }, scheduleSpan);
        
        apiCallFunc(doc,scheduleSpan);

        scheduleSpan.finish();
    });
};

/**
 * SCHEDULE START FUNCTION
 */
exports.startScheduler = function () {
    // metrics.startScheduleCounter();

    let parentSpan = initTracer.initTracer("ml-platform", config.app.title, {});

    log('info', {
        message: "Scheduler started - Loading all Schedules now"
    }, parentSpan);

    Scheduler.find({status: "active"}).exec(function (err, docs) {
        if (err) {
            log('info', {
                message: "An error occured in starting the schedules!"
            }, parentSpan);
            return;
        }

        for (var i = 0; i < docs.length; i++) {
            let doc = docs[i];
            scheduleJob(doc, parentSpan);
        }

        parentSpan.finish();
    });
};

exports.registerSchedule = function (req, res) {
    var reqBody = req.body;
    let parentSpan = initTracer.initTracer("ml-platform", config.app.title, req.headers);
    const span = global[ "tracer" ].startSpan("register-schedule", {
        childOf: parentSpan
    });

    log("info", {
        message: "reqbody in scheduling service------",
        reqBody: reqBody
    }, span);

    var scheduler = new Scheduler({
        label: reqBody.label,
        requestOptions: reqBody.requestOptions,
        scheduleCondition: reqBody.scheduleCondition,
        runCount: 0,
        createdDate: new Date(),
        status: 'active'
    });

    log("info", {
        message: "Registering metrics"
    }, span);

    // metrics.registerScheduleCounter();

    scheduler.save(function (err, doc) {
        if (err) {
            log('error', {
                error: 'An error occured in registering the schedule!'
            }, span);

            span.finish();
            parentSpan.finish();
            return res.status(400).jsonp({message: "An error occured in registering the schedule!"});
        }

        res.status(200).jsonp({message: "Schedule registered successfully!", doc: doc});

        log('info', {
            message: 'Schedule registered successfully!',
            doc: doc
        }, span);

        if (reqBody.flag === 'call-immediately') {
            console.log("flag-----------", reqBody.flag);
            apiCallFunc(doc, span);
        } 
        
        scheduleJob(doc, span);

        span.finish();
        parentSpan.finish();

        return;
    });

    console.log("schedule finsih");
};

exports.removeSchedule = function (req, res) {

    let parentSpan = initTracer.initTracer("ml-platform", config.app.title, req.headers);

    const span = global[ "tracer" ].startSpan("view-schedules", {
        childOf: parentSpan
    });

    var reqBody = req.body;
    // metrics.removeScheduleCounter();

    Scheduler.findOneAndUpdate({_id: mongoose.Types.ObjectId(reqBody.id)}, {
        $set: { status: 'inactive' }
    }, {upsert: "false", new: true}).exec(function (err, doc) {

        if (err) {

            span.finish();
            parentSpan.finish();
            return res.status(400).jsonp({message: "An error occured in registering the schedule!"});
        }

        log('info', {
            message: 'Schedule removed'
        }, span);

        span.finish();
        parentSpan.finish();

        global["scheduleObj"][reqBody.id].cancel();

        return res.status(200).jsonp({message: "Schedule disabled successfully!", doc: doc});
    });
};

exports.viewSchedules = function (req, res) {

    let parentSpan = initTracer.initTracer("ml-platform", config.app.title, req.headers);

    const span = global[ "tracer" ].startSpan("view-schedules", {
        childOf: parentSpan
    });

    // metrics.viewScheduleCounter();

    var queryMap = {};
    if (req.query.status) queryMap["status"] = req.query.status;
    if (req.query.id) queryMap["_id"] = mongoose.Types.ObjectId(req.query.id);
    if (req.query.label) queryMap["label"] = req.query.label;

    Scheduler.find(queryMap).exec(function (err, docs) {

        if (err) {

            log('error', {
                message: 'Error in fetching schedule'
            }, span);

            return res.status(400).jsonp({message: "An error occured in fetching the schedules!"});
        }

        log('info', {
            message: 'Schedule viewed'
        }, span);

        span.finish();
        parentSpan.finish();

        return res.status(200).jsonp({message: "Schedules fetched successfully!", doc: docs});
    });
};

exports.updateSchedule = function (req, res) {

    let parentSpan = initTracer.initTracer("ml-platform", config.app.title, req.headers);

    const span = global[ "tracer" ].startSpan("update-schedule", {
        childOf: parentSpan
    });

    var reqBody = req.body;
    // metrics.updateScheduleCounter();

    if (reqBody.createdDate || reqBody.lastRunDate || reqBody.runCount) {
        return res.status(400).jsonp({message: "Sorry! Invalid inputs!"});
    }

    Scheduler.findOneAndUpdate({_id: reqBody.id}, {$set: reqBody}, {new: true}).exec(function (err, doc) {
        if (err) {
            return res.status(400).jsonp({message: "An error occured in updating the schedule!"});
        }

        log('info', {
            message: 'Schedule updated'
        }, span);

        global["scheduleObj"][reqBody.id].cancel();
        scheduleJob(doc, span);

        span.finish();
        parentSpan.finish();

        return res.status(200).jsonp({message: "Schedule updated successfully!", doc: doc});
    });
};
