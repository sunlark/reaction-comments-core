import { ReactionCore } from "meteor/reactioncommerce:core";

ReactionCore.registerPackage({
  label: "Comments",
  name: "reaction-comments-core",
  icon: "fa fa-comments",
  autoEnable: true,
  settings: {
    moderation: {
      enabled: true
    }
  },
  registry: [{
    provides: "dashboard",
    // template: "commentsDashboard",
    label: "Comments",
    description: "Server part of comments functionality", // todo
    icon: "fa fa-comments",
    priority: 2,
    container: "utilities",
    permissions: [{
      label: "Comments",
      permission: "manageComments"
    }]
  }, {
    label: "Comments Settings",
    route: "/dashboard/comments/settings",
    provides: "settings",
    container: "dashboard"
    // template: "commentsSettings"
  }]
});
