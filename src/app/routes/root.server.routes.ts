'use strict';


module.exports = function (app) {

  app.get('/', function (req, res) {
    res.send('Hello world!');
  });

  // Finish with setting up the companyId param
  //app.param('Id', apiCtrl.func);

};
