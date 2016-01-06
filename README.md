# GitHub OAuth login

This plugin extends Strider with the ability to authenticate to Strider itself via GitHub OAuth. It uses GitHub organization membership, or teams within an organization, as a source of truth for authorization. Strider users are automatically created for GitHub users on first login.

## Configuration

The following variables must be present in your environment:

 * `PLUGIN_GITHUB_APP_ID` is the application ID from GitHub's OAuth registration.
 * `PLUGIN_GITHUB_APP_SECRET` is the application secret.
 * `PLUGIN_GITHUB_ACCESS_ORG` is the name of the GitHub organization used to control access.

GitHub users that belong to the named organization will be able to authenticate to Strider. The organization's owners will be administrators in Strider, as well. If you need finer-grained control than that, provide these additional variables to control access by teams instead:

 * `PLUGIN_GITHUB_ACCESS_TEAM` is the name of a team within the GitHub organization. Users must be a member of this group to have non-admin access to Strider.
 * `PLUGIN_GITHUB_ADMIN_TEAM` is the name of another team within the GitHub organization used to identify Strider administrators.
