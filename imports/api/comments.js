import { Mongo } from 'meteor/mongo';

import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { ReactionCore } from "meteor/reactioncommerce:core";

class CommentsCollection extends Mongo.Collection {
  insert(doc, callback) {
    doc.createdAt = doc.createdAt || new Date();
    return super.insert(doc, callback);
  }
}

export const Comments = new CommentsCollection('Comments');

// Deny all client-side updates since we will be using methods to manage this collection
// todo is it modern way?
Comments.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Comments.schema = new SimpleSchema({
  sourceId: {
    _id: {
      type: String
    },
    sourceId: {
      type: String
    },
    userId: {
      type: String
    },
    author: {
      type: String
    },
    email: {
      type: String,
      optional: true
    },
    ancestors: {
      type: [String],
      defaultValue: []
    },
    createdAt: {
      type: Date
    },
    body: {
      type: String
    },
    workflow: {
      type: ReactionCore.Schemas.Workflow
    },
    notifyApprove: {
      type: String,
      defaultValue: 'no'
    },
    notifyReply: {
      type: String,
      defaultValue: 'no'
    }
  }
});

Comments.attachSchema(Comments.schema);
