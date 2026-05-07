const mongoose = require('mongoose');

const linkedTransactionSchema = new mongoose.Schema({
  id: Number,
  initiatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  initiatorName: String,
  type: { type: String, enum: ['GAVE', 'GOT'] },
  amount: Number,
  desc: { type: String, default: '' },
  date: String
});

const chatMessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});

const monthlyHistorySchema = new mongoose.Schema({
  month: String,
  transactions: [linkedTransactionSchema],
  totalGave: { type: Number, default: 0 },
  totalGot: { type: Number, default: 0 }
});

const linkedLedgerSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactions: [linkedTransactionSchema],
  chat: [chatMessageSchema],
  lastActiveMonth: { type: String, default: '' },
  monthlyHistory: [monthlyHistorySchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LinkedLedger', linkedLedgerSchema);
