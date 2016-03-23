import { SimpleSchema } from "meteor/aldeed:simple-schema";
import { ReactionCore } from "meteor/reactioncommerce:core";

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
  content: {
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
