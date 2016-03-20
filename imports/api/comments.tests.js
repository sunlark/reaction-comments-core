import { Meteor } from "meteor/meteor";

import { Comments } from "./comments.js";

if(Meteor.isServer) {
  require("./server/publications.js");

  // todo
}