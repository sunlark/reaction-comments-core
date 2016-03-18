Package.describe({
  name: "sunlark:reaction-comments-core",
  version: "0.0.1"
});

Npm.depends({
  // moment: "2.10.6"
});

Package.onUse(function (api) {
  api.versionsFrom("METEOR@1.3-beta.16");
  api.use("meteor-base");
  api.use("mongo");
  api.use("ecmascript");
  api.use("es5-shim");
  // I guess this is temporary here for sessionId holding
  api.use("session");
  api.use("tracker");
  api.use("modules");
  // todo do we need this?
  // Looks like this is used by cfs
  api.use("http");
  // todo do we need this?
  api.use("ejson");
  api.use("logging");
  //api.use("reload");
  api.use("check");
  api.use("aldeed:simple-schema");
  api.use("mdg:validated-method");
  // I'm not sure, but this could be used by ValidatedMethods to insert
  api.use("random");
  api.use("ddp-rate-limiter");
  api.use("underscore");
  api.use("service-configuration");
  api.use("amplify@1.0.0");
  api.use("fortawesome:fontawesome@4.5.0");

  //api.imply("tracker");

  api.mainModule("server/main.js", "server");
    // api.export("Foo");

  api.addAssets("private/data/i18n/en.json", "server");
  api.addAssets("private/data/i18n/ru.json", "server");
});
