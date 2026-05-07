const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  id: Number,
  type: { type: String, enum: ['GAVE', 'GOT'] },
  amount: Number,
  desc: String,
  date: String
});

const personSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.Mixed,
  name: String,
  transactions: [transactionSchema],
  interestMode: { type: String, default: 'none' },
  interestRate: { type: Number, default: 0 },
  timeValue: { type: Number, default: 0 },
  timeUnit: { type: String, default: 'years' },
  interestFreq: { type: String, default: 'yearly' },
  isGroup: { type: Boolean, default: false },
  members: [mongoose.Schema.Types.Mixed],
  isGeneral: { type: Boolean, default: false },
  // Linked user fields
  isLinked: { type: Boolean, default: false },
  linkedLedgerId: { type: mongoose.Schema.Types.ObjectId, ref: 'LinkedLedger', default: null },
  linkedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

const peopleDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  people: [personSchema]
});

module.exports = mongoose.model('PeopleData', peopleDataSchema);
