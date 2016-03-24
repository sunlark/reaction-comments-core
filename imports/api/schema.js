import { SimpleSchema } from "meteor/aldeed:simple-schema";
import { ReactionCore } from "meteor/reactioncommerce:core";

// todo labels. i18n for labels??
// todo should schema be global?
// export default Comments = new SimpleSchema({
ReactionCore.Schemas.Comments = new SimpleSchema({
  _id: {
    type: String
  },
  ancestors: {
    type: [String],
    defaultValue: []
  },
  shopId: {
    type: String,
    index: 1,
    autoValue: ReactionCore.shopIdAutoValue,
    label: "Comment shopId"
  },
  sourceId: {
    type: String,
    index: 1 // todo check indexes
  },
  userId: {
    type: String
  },
  name: {
    type: String,
    label: "Name"
  },
  email: {
    type: String,
    optional: true,
    regEx: SimpleSchema.RegEx.Email
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
    type: Object,
    blackbox: true
  },
  workflow: {
    type: ReactionCore.Schemas.Workflow
  },
  notify: {
    type: Boolean,
    defaultValue: true
  }
});
