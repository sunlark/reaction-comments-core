import { Mongo } from "meteor/mongo";
import { ReactionCore } from "meteor/reactioncommerce:core";
import "./schema";

ReactionCore.Collections.Comments = new Mongo.Collection("Comments");

ReactionCore.Collections.Comments.attachSchema(ReactionCore.Schemas.Comments);

// Deny all client-side updates since we will be using methods to manage this collection
// todo is it a modern way?

ReactionCore.Collections.Comments.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; }
});
