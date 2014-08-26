module.exports = {
    // mongoose schema, if you need project-specific config
    config: {
        "template": {
            environment: {type: String, default: 'Hi from `environment`'},
            prepare: {type: String, default: 'Hi from `prepare`'},
            test: {type: String, default: 'Hi from `test`'},
            deploy: {type: String, default: 'Hi from `deploy`'},
            cleanup: {type: String, default: 'Hi from `cleanup`'}
        }
    },
    // Define project-specific routes
    //   all routes created here are namespaced within /:org/:repo/api/:pluginid
    //   req.project is the current project
    //   req.accessLevel is the current user's access level for the project
    //      0 - anonymous, 1 - authed, 2 - admin / collaborator
    //   req.user is the current user
    //   req.pluginConfig() -> get the config for this plugin
    //   req.pluginConfig(config, cb(err)) -> set the config for this plugin
    routes: function (app, context) {
    },
    // Define global routes
    //   all routes namespaced within /ext/:pluginid
    //   req.user is the current user
    //   req.user.account_level can be used for authorization
    //      0 - anonymous, 1 - authed, 2 - admin / collaborator
    globalRoutes: function (app, context) {
    },
    // Listen for global events
    //   all job-local events that begin with `plugin.` are proxied to
    //   the main strider eventemitter, so you can listen for them here.
    //   Other events include `job.new`, `job.done` and `browser.update`.
    listen: function (emitter, context) {
    }


};