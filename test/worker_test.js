var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var Worker = require('../worker.js');
var WebApp = require('../webapp.js');

describe("template worker test example", function() {
	var work = null;
	var io = null;
	var context = null;
	var config = null;
	var job = null;
	var exitCode = null;

	var prepareWorker = function(done) {
		context = {};
		io = {
			on: sinon.stub().yields('123', { exitCode: exitCode }),
			removeListener: sinon.stub(),
			emit: sinon.stub()
		};
		Worker.init(config, job, sinon.stub(), function(err, res) {
			work = function(){
				return res;
			};
			if (done) done();
		})
	};

	beforeEach(function(done) {
		exitCode = 0;
		job = {
			project: { name: "strider-template" },
			ref: { branch: "master" },
			_id: "123",
			trigger: {
				type: "manual"
			}
		};
		process.env.strider_server_name = "http://example.com";
		config = {
			environment: "test message",
			prepare: "test message"
		};
		//_.each(schema, function(v,k) { config[k] = v.default });
		//config.token = 'token';
		//config.subdomain = 'subdomain';

		prepareWorker(done);
	});

	it("should set up the phase actions properly", function() {
		var setup = work();
		//environment returns a string
		expect(setup.environment).to.equal('echo "test message"');
		//prepare returns an object
		expect(setup.prepare.command).to.equal('echo');
		expect(setup.prepare.args[0]).to.equal('"test message"');

		//test returns a function
		expect(typeof setup.test).to.equal('function');
	});

});
