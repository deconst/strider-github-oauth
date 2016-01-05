var GitHubStrategy = require('passport-github2').Strategy;

module.exports = function(context, done) {
  var app = context.app;
  var passport = context.passport;
  var User = context.models.User;

  var tryAddresses = function(addresses, i, e, cb) {
    if (i >= addresses.length) {
      return cb(e);
    }

    var current = addresses[i];

    User.findByEmail(current, function(err, users) {
      if (err) return cb(err);

      if (users.length === 0) {
        return tryAddresses(addresses, i + 1, e, cb);
      }

      if (users.length > 1) {
        var duplicate = new Error("More than one user had the address " + current);
        return tryAddresses(addresses, i + 1, duplicate, cb);
      }

      return cb(null, users[0]);
    });
  };

  app.registerAuthStrategy(new GitHubStrategy({
    clientID: process.env.PLUGIN_GITHUB_APP_ID,
    clientSecret: process.env.PLUGIN_GITHUB_APP_SECRET,
    callbackURL: 'http://localhost:3000/github/auth/callback/'
  }, function(accessToken, refreshToken, profile, cb) {
    var addresses = [];
    if (profile.email) {
      addresses.push(profile.email);
    }

    profile.emails.forEach(function(each) {
      addresses.push(each.value);
    });

    if (addresses.length === 0) {
      return cb(new Error('There are no email addresses on your GitHub profile.'));
    }

    tryAddresses(addresses, 0, new Error('User not found.'), cb);
  }));

  app.get('/github/auth/login/',
    passport.authenticate('github', {
      scope: ['user:email', 'read:org']
    }));
  app.get('/github/auth/callback/',
    passport.authenticate('github', {
      failureRedirect: '/login?failed=true'
    }),
    function(req, res) {
      res.redirect('/');
    });

  context.registerBlock('LoggedOutFillContent', function(context, cb) {
    var snippet = '<a href="/github/auth/login/">Log in with GitHub</a>';

    cb(null, snippet);
  });

  done(null);
};
