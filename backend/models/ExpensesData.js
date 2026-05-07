const mongoose = require('mongoose');

const expenseItemSchema = new mongoose.Schema({
  id: Number,
  name: String,
  amount: Number,
  date: String,
  icon: String
});

const expensesDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  budget: { type: Number, default: 0 },
  list: [expenseItemSchema],
  lastActiveMonth: { type: String, default: '' },
  historyStats: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }
});

module.exports = mongoose.model('ExpensesData', expensesDataSchema);
