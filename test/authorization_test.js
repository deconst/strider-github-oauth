var nock = require('nock');
var chai = require('chai');
var dirtyChai = require('dirty-chai');
chai.use(dirtyChai);
var expect = chai.expect;

var authorization = require('../authorization');
var config = require('../config');
var mock = require('./mock');

describe("user authorization", function() {

  var profile = {
    id: 12,
    displayName: 'displayName',
    username: 'username',
    emails: [{ value: 'me@gmail.com' }],
    profileUrl: 'https://localhost/users/12',
    _json: {
      login: 'json_login',
      gravatar_id: 'whatever'
    }
  };

  var context = {
    models: { User: mock.MockUser },
    logger: mock.logger
  };

  var strategyCallback = null;

  var shouldDeny = function (p, done) {
    if (!done) {
      done = p
      p = profile
    }

    strategyCallback('12345', null, p, function (err, user) {
      expect(err.message).to.equal('User not authorized');
      expect(user).to.be.undefined();

      done(null, user);
    });
  };

  var shouldGrantAccess = function (p, done) {
    if (!done) {
      done = p
      p = profile
    }

    strategyCallback('12345', null, p, function (err, user) {
      expect(err).to.be.null();
      expect(user.account_level).to.equal(0);

      done(null, user);
    });
  };

  var shouldGrantAdmin = function (done) {
    strategyCallback('12345', null, profile, function (err, user) {
      expect(err).to.be.null();
      expect(user.account_level).to.equal(1);

      done();
    });
  };

  var withEmails = function (emails) {
    if (!emails) {
      emails = [
        { email: 'me@gmail.com', verified: true, primary: true }
      ]
    }

    return nock('https://api.github.com/')
      .get('/user/emails')
      .reply(200, emails);
  }

  beforeEach(function () {
    config.apiEndpoint = 'https://api.github.com/';

    strategyCallback = authorization.makeStrategyCallback(context);
  });

  describe("based on organization membership", function () {

    beforeEach(function () {
      config.orgName = "the-org";
      config.accessTeamName = null;
      config.adminTeamName = null;
    });

    it("denies access to users not in the org", function (done) {
      withEmails()
        .get('/user/memberships/orgs/the-org')
        .reply(404);

      shouldDeny(done);
    });

    it("grants access to users in the org", function (done) {
      withEmails()
        .get('/user/memberships/orgs/the-org')
        .reply(200, {
          state: 'active'
        });

      shouldGrantAccess(done);
    });

    it("grants admin access to owners in the org", function (done) {
      withEmails()
        .get('/user/memberships/orgs/the-org')
        .reply(200, {
          state: 'active',
          role: 'admin'
        });

      shouldGrantAdmin(done);
    });

  });

  describe("based on team membership", function () {

    var notOnOrg = function () {
      return withEmails()
        .get('/orgs/the-org/teams')
        .twice()
        .reply(403);
    };

    var onOrg = function () {
      return withEmails()
        .get('/orgs/the-org/teams')
        .twice()
        .reply(200, [
          { id: 111, name: 'access-team' },
          { id: 222, name: 'admin-team' }
        ]);
    };

    beforeEach(function () {
      config.orgName = "the-org";
      config.accessTeamName = "access-team";
      config.adminTeamName = "admin-team";
    });

    it("denies access to users not in the org", function (done) {
      notOnOrg();
      shouldDeny(done);
    });

    it("denies access to users in the org but not in either team", function (done) {
      onOrg()
        .get('/teams/111/memberships/json_login')
        .reply(404)
        .get('/teams/222/memberships/json_login')
        .reply(404);
      shouldDeny(done);
    });

    it("grants access to users in the access team", function (done) {
      onOrg()
        .get('/teams/111/memberships/json_login')
        .reply(200, { state: 'active' })
        .get('/teams/222/memberships/json_login')
        .reply(404);
      shouldGrantAccess(done);
    });

    it("grants admin to users in the admin team", function (done) {
      onOrg()
        .get('/teams/111/memberships/json_login')
        .reply(404)
        .get('/teams/222/memberships/json_login')
        .reply(200, { state: 'active' });
      shouldGrantAdmin(done);
    });

  });

  describe('without a public email address', function () {
    var emailless = {
      id: 13,
      displayName: 'No Email',
      username: 'emailless',
      profileUrl: 'https://localhost/users/13',
      _json: {
        login: 'json_login',
        gravatar_id: 'whatever'
      }
    };

    var onOrgAnd = function (n) {
      config.orgName = "the-org";
      config.accessTeamName = null;
      config.adminTeamName = null;

      return n.get('/user/memberships/orgs/the-org').reply(200, { state: 'active' });
    };

    it('checks for emails from the GitHub API', function (done) {
      onOrgAnd(withEmails([
        { email: 'additional@gmail.com', verified: true, primary: true }
      ]));

      shouldGrantAccess(emailless, function (err, user) {
        if (err) return done(err);

        expect(user.email).to.equal('additional@gmail.com');

        done();
      });
    });

    it('uses your primary email address to create a user account', function (done) {
      onOrgAnd(withEmails([
        { email: 'first@gmail.com', verified: true, primary: false },
        { email: 'primary@gmail.com', verified: true, primary: true },
        { email: 'extra@gmail.com', verified: true, primary: false }
      ]));

      shouldGrantAccess(emailless, function (err, user) {
        if (err) return done(err);

        expect(user.email).to.equal('primary@gmail.com');

        done()
      })
    });

    it('uses the first verified email address if the primary address is not verified', function (done) {
      onOrgAnd(withEmails([
        { email: 'unverified.primary@gmail.com', verified: false, primary: true },
        { email: 'unverified@gmail.com', verified: false, primary: false },
        { email: 'correct@gmail.com', verified: true, primary: false },
        { email: 'extra@gmail.com', verified: true, primary: false }
      ]));

      shouldGrantAccess(emailless, function (err, user) {
        if (err) return done(err);

        expect(user.email).to.equal('correct@gmail.com');

        done();
      });
    });
  });

});
