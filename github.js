var request = require('request');
var parseLinkHeader = require('parse-link-header');

var config = require('./config');

function GitHub(profile, accessToken) {
  this.profile = profile;
  this.accessToken = accessToken;

  this.api = request.defaults({
    baseUrl: config.apiEndpoint,
    json: true,
    headers: {
      Authorization: 'token ' + accessToken,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'request strider-github-auth'
    }
  });
}

GitHub.prototype.belongsToOrganization = function (orgName, callback) {
  var p = '/user/memberships/orgs/' +  encodeURIComponent(orgName);

  this.api.get(p, function (err, response, body) {
    if (err) return callback(err);

    if (response.statusCode === 200 && body.state === 'active') {
      return callback(null, true, body.role === 'admin');
    }

    callback(null, false, false);
  });
};

GitHub.prototype.belongsToTeam = function (teamId, callback) {
  var p = '/teams/';
  p += encodeURIComponent(teamId);
  p += '/memberships/';
  p += encodeURIComponent(this.profile._json.login);

  this.api.get(p, function (err, response, body) {
    if (err) return callback(err);

    if (response.statusCode === 404) {
      return callback(null, false);
    }

    if (response.statusCode !== 200) {
      return callback(new Error({
        message: 'Unexpected status from GitHub API',
        path: p,
        statusCode: response.statusCode,
        body: body
      }));
    }

    callback(null, body.state === 'active');
  });
};

GitHub.prototype.findTeamWithName = function (orgName, teamName, callback) {
  var p = '/org/';
  p += encodeURIComponent(orgName);
  p += '/teams';

  var consumePage = function (u) {
    this.api.get(u, function (err, response, body) {
      if (err) return callback(err);

      if (response.statusCode !== 200) {
        return callback(new Error({
          message: 'Unexpected status from GitHub API',
          path: p,
          statusCode: response.statusCode,
          body: body
        }));
      }

      for (var i = 0; i < body.length; i++) {
        if (body[i].name === teamName) {
          return callback(null, body[i].id);
        }
      }

      var link = response.headers.link;
      var parsed = link && parseLinkHeader(link);

      if (!link || !parsed.next) {
        return callback(new Error({
          message: 'Team name ' + teamName + ' not found',
          path: p
        }));
      }

      consumePage(link.next);
    });
  };

  consumePage(p);
};

exports.GitHub = GitHub;
