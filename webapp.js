var GitHubStrategy = require('passport-github2').Strategy;
var fs = require('fs');
var path = require('path');

var config = require('./config');
var authorization = require('./authorization');

module.exports = function(context, done) {
  var app = context.app;
  var passport = context.passport;

  app.registerAuthStrategy(new GitHubStrategy({
    clientID: config.clientId,
    clientSecret: config.clientSecret,
    callbackURL: config.serverName + '/github/auth/callback/'
  }, authorization.makeStrategyCallback(context)));

  app.get('/github/auth/login/',
    passport.authenticate('github', {
      scope: ['user:email', 'read:org', 'repo']
    }));
  app.get('/github/auth/callback/',
    passport.authenticate('github', {
      failureRedirect: '/login?failed=true'
    }),
    function(req, res) {
      res.redirect('/');
    });

  context.registerBlock('ExtraLoginButton', function (context, cb) {
    var templatePath = path.join(__dirname, './static/extra-login-button.html');
    fs.readFile(templatePath, { encoding: 'utf-8' }, cb);
  });

  context.registerBlock('LoggedOutFillContent', function (context, cb) {
    var templatePath = path.join(__dirname, './static/login.html');
    fs.readFile(templatePath, { encoding: 'utf-8' }, cb);
  });

  done(null);
};
