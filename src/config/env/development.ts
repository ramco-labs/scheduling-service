'use strict';

module.exports = {
	app: {
		title: 'API Scheduler',
		description: 'API Scheduler',
		url: 'http://localhost:8100'
	},
	port: process.env.NODEJS_SCHEDULER_PORT || 8100,
	hostname: process.env.NODEJS_SCHEDULER_HOST || "localhost",
	authorization: process.env.NODEJS_SCHEDULER_AUTHORIZATION || "schedule@123",
	db: {
		mongodb: 'mongodb://' + (process.env.MONGO_HOST || 'localhost:27017') + ":" + process.env.MONGO_PORT + "/" + process.env.MONGO_DBNAME
	},
	jaeger: {
        host: process.env.JAEGER_HOST || 'localhost',
        port: process.env.JAEGER_PORT || 6832
    }
};
