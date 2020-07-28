const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const Record = new Schema({
  title: String,
  mztID: Number,
  thumb: String,
});

module.exports = mongoose.model('mzt_record', Record);
