// Strider (destructively) converts the environment variable SERVER_NAME to strider_server_name.
// What the hell, Strider
exports.serverName = process.env.strider_server_name || 'http://localhost:3000';

exports.clientId = process.env.PLUGIN_GITHUB_APP_ID;
exports.clientSecret = process.env.PLUGIN_GITHUB_APP_SECRET;
exports.apiEndpoint = process.env.PLUGIN_GITHUB_API_ENDPOINT || 'https://api.github.com/';

exports.orgName = process.env.PLUGIN_GITHUB_ACCESS_ORG;
exports.accessTeamName = process.env.PLUGIN_GITHUB_ACCESS_TEAM;
exports.adminTeamName = process.env.PLUGIN_GITHUB_ADMIN_TEAM;
