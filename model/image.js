const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const Image = new Schema({
  mztID: Number,
  url: String,
});

module.exports = mongoose.model("mzt_image", Image);
