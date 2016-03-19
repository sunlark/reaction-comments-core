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
    template: "commentsDashboard",
    label: "Comments",
    description: "Comments",/// todo
    icon: "fa fa-comments",
    priority: 1,
    container: "utilities",
    permissions: [{
      label: "Comments",
      permission: "manageComments"
    }]
  }, {
    provides: "settings"
  }]
});