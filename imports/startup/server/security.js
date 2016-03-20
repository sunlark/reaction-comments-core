import { Meteor } from "meteor/meteor";
import { DDPRateLimiter } from "meteor/ddp-rate-limiter";
import * as methods from "../../api/methods";

const COMMENTS_METHODS = [];

for (let method in methods) {
  COMMENTS_METHODS.push(method.name);
}
console.dir(COMMENTS_METHODS);
//const COMMENTS_METHODS = methods.map(method => method.name);

if (Meteor.isServer) {
  const commentRule = {
    name(name) {
      return COMMENTS_METHODS.some(method => method === name);
    },
    type: "method"
  };

  // Only allow 5 operations per connection per second
  DDPRateLimiter.addRule(commentRule, 5, 1000);
}
