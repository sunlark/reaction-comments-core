import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from "meteor/ddp-rate-limiter";
import * as methods from "../../methods";

const COMMENTS_METHODS = methods.map(method => method.name);

if (Meteor.isServer) {

  const commentRule = {
    name(name) {
      return COMMENTS_METHODS.some(method => method === name)
    },
    type: 'method'
  };

  // Only allow 5 operations per connection per second
  DDPRateLimiter.addRule(commentRule, 5, 1000);
}