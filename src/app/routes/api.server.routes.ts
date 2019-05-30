'use strict';

import {getMetrics} from '../controllers/metrics.server.controller';

module.exports = function (app) {
    var authCtrl = require('../../app/controllers/auth.server.controller'),
        scheduleCtrl = require('../../app/controllers/scheduler.server.controller');

    app.route('/metrics').get(getMetrics);

    app.route('/schedule')
        .post(authCtrl.authenticate, scheduleCtrl.registerSchedule)
        .put(authCtrl.authenticate, scheduleCtrl.updateSchedule)
        .delete(authCtrl.authenticate, scheduleCtrl.removeSchedule)
        .get(authCtrl.authenticate, scheduleCtrl.viewSchedules);

    scheduleCtrl.startScheduler();

    // app.route('/scheduler/start').post(authCtrl.authenticate, scheduleCtrl.startScheduler);

    // Finish with setting up the companyId param
    //app.param('Id', apiCtrl.func);

};
