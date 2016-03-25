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

	var shouldDeny = function (done) {
		strategyCallback('12345', null, profile, function (err, user) {
			expect(err.message).to.equal('User not authorized');
			expect(user).to.be.undefined();

			done();
		});
	};

	var shouldGrantAccess = function (done) {
		strategyCallback('12345', null, profile, function (err, user) {
			expect(err).to.be.null();
			expect(user.account_level).to.equal(0);

			done();
		});
	};

	var shouldGrantAdmin = function (done) {
		strategyCallback('12345', null, profile, function (err, user) {
			expect(err).to.be.null();
			expect(user.account_level).to.equal(1);

			done();
		});
	};

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
			nock('https://api.github.com/')
				.get('/user/memberships/orgs/the-org')
				.reply(404);

			shouldDeny(done);
		});

		it("grants access to users in the org", function (done) {
			nock('https://api.github.com/')
				.get('/user/memberships/orgs/the-org')
				.reply(200, {
					state: 'active'
				});

			shouldGrantAccess(done);
		});

		it("grants admin access to owners in the org", function (done) {
			nock('https://api.github.com/')
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
			return nock('https://api.github.com/')
				.get('/orgs/the-org/teams')
				.twice()
				.reply(403);
		};

		var onOrg = function () {
			return nock('https://api.github.com/')
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
			emails: [{ value: undefined }],
			profileUrl: 'https://localhost/users/13',
			_json: {
				login: 'json_login',
				gravatar_id: 'whatever'
			}
		};

		var withEmails = function (emails) {
			return nock('https://api.github.com/')
				.get('/user/emails')
				.reply(200, emails);
		}

		it('checks for additional emails from the GitHub API');

		it('uses only verified email addresses');

		it('uses your primary email address to create a user account');
	});

});
