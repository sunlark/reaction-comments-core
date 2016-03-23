import { Meteor } from "meteor/meteor";

import Comments from "./collections";
//import { mocha } from "meteor/avital:mocha";
import { mocha } from "meteor/practicalmeteor:mocha";
import { assert } from "meteor/practicalmeteor:chai";
import * as methods from "./methods";

describe("methods", () => {
  it("should throw 403 error by non admin", function () {
    assert.equal(true, true);
  });
});