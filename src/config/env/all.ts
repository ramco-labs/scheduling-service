'use strict';

module.exports = {
	app: {
		title: 'API Scheduler',
		description: 'API Scheduler',
		url: 'http://localhost'
	},
	port: process.env.NODEJS_SCHEDULER_PORT,
	hostname: process.env.NODEJS_SCHEDULER_HOST
};
