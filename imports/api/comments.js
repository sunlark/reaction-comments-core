import { Mongo } from 'meteor/mongo';

import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { ReactionCore } from "meteor/reactioncommerce:core";

ReactionCore.Collections.Comments = new Mongo.Collection('Comments');

// Deny all client-side updates since we will be using methods to manage this collection
// todo is it a modern way?

ReactionCore.Collections.Comments.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; }
});

// todo labels. i18n for labels??

ReactionCore.Schemas.Comments = new SimpleSchema({
  _id: {
    type: String
  },
  shopId: {
    type: String,
    index: 1,
    autoValue: ReactionCore.shopIdAutoValue,
    label: "Comment shopId"
  },
  sourceId: {
    type: String,
    index: 1   // todo check indexes
  },
  userId: {
    type: String
  },
  author: {
    type: String,
    label: "Name"
  },
  email: {
    type: String,
    optional: true,
    regEx: SimpleSchema.RegEx.Email
  },
  ancestors: {
    type: [String],
    defaultValue: []
  },
  createdAt: {
    type: Date,
    autoValue: function () {
      if (this.isInsert) {
        return new Date;
      }
    },
    denyUpdate: true // todo check no update
  },
  body: {
    type: String
  },
  workflow: {
    type: ReactionCore.Schemas.Workflow
  },
  notifyReply: {
    type: Boolean,
    defaultValue: false
  }
});

ReactionCore.Collections.Comments.attachSchema(ReactionCore.Schemas.Comments);
