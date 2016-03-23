Package.describe({
  name: "sunlark:reaction-comments-core",
  version: "0.0.1"
});

Npm.depends({
  // moment: "2.10.6"
  "i18next": "2.3.5"
});

Package.onUse(function (api) {
  api.versionsFrom("METEOR@1.3-rc.8");
  api.use("meteor-base");
  api.use("mongo");
  api.use("ecmascript");
  api.use("es5-shim");
  api.use("modules");
  api.use("ejson");
  api.use("logging");
  api.use("check");
  api.use("aldeed:simple-schema");
  api.use("mdg:validated-method");
  api.use("random");
  api.use("ddp-rate-limiter");
  api.use("underscore");

  api.use("reactioncommerce:core@0.12.0");
  api.use("reactioncommerce:reaction-schemas@2.0.3");
  api.mainModule("client/main.js", "client");
  api.mainModule("server/main.js", "server");

  api.addAssets("private/data/i18n/en.json", "server");
  api.addAssets("private/data/i18n/ru.json", "server");
});
