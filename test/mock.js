var util = require('util');
var equal = require('deep-equal');

function MockUser () {
  this.email = null;
  this.created = null;
  this.password = null;
  this.account_level = 0;
  this.projects = [];
  this.accounts = [];
}

MockUser.prototype.set = function (arg, value) {
  this[arg] = value;
};

MockUser.prototype.account = function (name, id) {
  return null;
};

MockUser.prototype.save = function (callback) {
  // No-op
  callback(null);
};

var plantedUsers = [];

MockUser.plant = function (query, instance) {
  plantedUsers.push([query, instance]);
};

MockUser.find = function (query, callback) {
  var matches = plantedUsers.filter(function (each) {
    return equal(each[0], query, { strict: true });
  }).map(function (each) {
    return each[1];
  });

  callback(null, matches);
};

var messageLogger = function (level) {
  return function (msg, obj) {
    if (!process.env.TEST_LOG) return;

    console.log(level + ': ' + msg);
    if (obj) {
      console.log(util.inspect(obj, { depth: null }));
    }
  };
};

var logger = {
  debug: messageLogger('DEBUG'),
  info: messageLogger(' INFO')
};

module.exports = {
  MockUser: MockUser,
  logger: logger
};
