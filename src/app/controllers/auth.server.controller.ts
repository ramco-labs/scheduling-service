var config = require('../../config/config');
var NodeRSA = require('node-rsa'),
  fs = require('fs'),
  argv = require('minimist')(process.argv.slice(2));

/**
 * AUTHENTICATION MIDDLEWARE FUNCTION
 */
exports.authenticate = function (req, res, next) {
  if (req.headers.authorization === config.authorization) {
    next();
  } else {
    return res.status(400).jsonp({ message: 'You may be unauthorized to do this request! Please add the token' });
  }
};