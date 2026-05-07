const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ExpensesData = require('../models/ExpensesData');
const PeopleData = require('../models/PeopleData');
const LinkedLedger = require('../models/LinkedLedger');
const User = require('../models/User');

// ── balance helper (server-side) ──────────────────────────────────────────────
function calcBalance(transactions, myId) {
  return transactions.reduce((bal, t) => {
    const isMine = t.initiatorId.toString() === myId.toString();
    return bal + (isMine ? (t.type === 'GAVE' ? t.amount : -t.amount)
                         : (t.type === 'GAVE' ? -t.amount : t.amount));
  }, 0);
}

// ==================== EXPENSES ====================

router.get('/expenses', auth, async (req, res) => {
  try {
    let data = await ExpensesData.findOne({ userId: req.userId });
    if (!data) { data = new ExpensesData({ userId: req.userId }); await data.save(); }
    res.json(data);
  } catch { res.status(500).json({ message: 'Error fetching expenses' }); }
});

router.put('/expenses', auth, async (req, res) => {
  try {
    const { budget, list, lastActiveMonth, historyStats } = req.body;
    const data = await ExpensesData.findOneAndUpdate(
      { userId: req.userId }, { budget, list, lastActiveMonth, historyStats }, { new: true, upsert: true }
    );
    res.json(data);
  } catch { res.status(500).json({ message: 'Error saving expenses' }); }
});

// ==================== PEOPLE ====================

router.get('/people', auth, async (req, res) => {
  try {
    let data = await PeopleData.findOne({ userId: req.userId });
    if (!data) {
      data = new PeopleData({ userId: req.userId, people: [{ id: 'myself', name: 'Myself', transactions: [], interestMode: 'none', isGroup: false, members: [], isGeneral: false }] });
      await data.save();
    }
    res.json(data.people);
  } catch { res.status(500).json({ message: 'Error fetching people' }); }
});

router.put('/people', auth, async (req, res) => {
  try {
    const { people } = req.body;
    const data = await PeopleData.findOneAndUpdate({ userId: req.userId }, { people }, { new: true, upsert: true });
    res.json(data.people);
  } catch { res.status(500).json({ message: 'Error saving people' }); }
});

// ==================== LINKED LEDGER ====================

// POST /api/data/link-user  →  Link with existing user
router.post('/link-user', auth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const myId = req.userId;
    if (targetUserId === myId.toString()) return res.status(400).json({ message: 'Cannot link with yourself' });

    const targetUser = await User.findById(targetUserId).select('name email');
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    const myUser = await User.findById(myId).select('name');

    const existing = await LinkedLedger.findOne({
      $or: [{ user1: myId, user2: targetUserId }, { user1: targetUserId, user2: myId }]
    });
    if (existing) return res.status(400).json({ message: 'Already linked', linkedLedgerId: existing._id });

    const ledger = new LinkedLedger({ user1: myId, user2: targetUserId, transactions: [], chat: [], lastActiveMonth: '' });
    await ledger.save();

    const base = { transactions: [], interestMode: 'none', interestRate: 0, timeValue: 0, timeUnit: 'years', interestFreq: 'yearly', isGroup: false, members: [], isGeneral: false, isLinked: true, linkedLedgerId: ledger._id };
    const myEntry    = { ...base, id: Date.now(),     name: targetUser.name, linkedUserId: targetUserId };
    const theirEntry = { ...base, id: Date.now() + 1, name: myUser.name,    linkedUserId: myId };

    await PeopleData.findOneAndUpdate({ userId: myId },        { $push: { people: myEntry } },    { upsert: true });
    await PeopleData.findOneAndUpdate({ userId: targetUserId }, { $push: { people: theirEntry } }, { upsert: true });

    res.json({ message: 'Linked', person: myEntry, linkedLedgerId: ledger._id });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Failed to link', error: err.message }); }
});

// DELETE /api/data/link/:ledgerId  →  Unlink: delete ledger + remove from both PeopleData
router.delete('/link/:ledgerId', auth, async (req, res) => {
  try {
    const ledger = await LinkedLedger.findById(req.params.ledgerId);
    if (!ledger) return res.status(404).json({ message: 'Not found' });

    const myId = req.userId.toString();
    if (ledger.user1.toString() !== myId && ledger.user2.toString() !== myId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove from both users' PeopleData
    await PeopleData.findOneAndUpdate({ userId: ledger.user1 }, { $pull: { people: { linkedLedgerId: ledger._id } } });
    await PeopleData.findOneAndUpdate({ userId: ledger.user2 }, { $pull: { people: { linkedLedgerId: ledger._id } } });

    // Delete the ledger itself
    await LinkedLedger.findByIdAndDelete(req.params.ledgerId);

    res.json({ message: 'Unlinked and deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Failed to unlink' }); }
});

// GET /api/data/linked-balances  →  All linked balances for current user (single call)
router.get('/linked-balances', auth, async (req, res) => {
  try {
    const myId = req.userId;
    const ledgers = await LinkedLedger.find({
      $or: [{ user1: myId }, { user2: myId }]
    }).select('transactions');

    const balances = {};
    ledgers.forEach(l => {
      balances[l._id.toString()] = calcBalance(l.transactions, myId);
    });

    res.json({ balances });
  } catch { res.status(500).json({ message: 'Failed to get balances' }); }
});

// GET /api/data/linked/:id  →  Full linked ledger
router.get('/linked/:id', auth, async (req, res) => {
  try {
    const ledger = await LinkedLedger.findById(req.params.id);
    if (!ledger) return res.status(404).json({ message: 'Not found' });
    const myId = req.userId.toString();
    if (ledger.user1.toString() !== myId && ledger.user2.toString() !== myId) return res.status(403).json({ message: 'Access denied' });
    res.json(ledger);
  } catch { res.status(500).json({ message: 'Failed to get linked ledger' }); }
});

// POST /api/data/linked/:id/rollover  →  Archive month, clear transactions
router.post('/linked/:id/rollover', auth, async (req, res) => {
  try {
    const { month } = req.body;
    const ledger = await LinkedLedger.findById(req.params.id);
    if (!ledger) return res.status(404).json({ message: 'Not found' });
    const myId = req.userId.toString();
    if (ledger.user1.toString() !== myId && ledger.user2.toString() !== myId) return res.status(403).json({ message: 'Access denied' });

    if (ledger.lastActiveMonth && ledger.lastActiveMonth !== month && ledger.transactions.length > 0) {
      const txs = ledger.transactions;
      const totalGave = txs.reduce((s, t) => s + (t.type === 'GAVE' ? t.amount : 0), 0);
      const totalGot  = txs.reduce((s, t) => s + (t.type === 'GOT'  ? t.amount : 0), 0);
      ledger.monthlyHistory.push({ month: ledger.lastActiveMonth, transactions: txs, totalGave, totalGot });
      if (ledger.monthlyHistory.length > 24) ledger.monthlyHistory = ledger.monthlyHistory.slice(-24);
      ledger.transactions = [];
    }
    ledger.lastActiveMonth = month;
    await ledger.save();
    res.json(ledger);
  } catch (err) { res.status(500).json({ message: 'Rollover failed', error: err.message }); }
});

// POST /api/data/linked/:id/transaction  →  Add transaction
router.post('/linked/:id/transaction', auth, async (req, res) => {
  try {
    const { type, amount, desc, date } = req.body;
    const ledger = await LinkedLedger.findById(req.params.id);
    if (!ledger) return res.status(404).json({ message: 'Not found' });
    const myId = req.userId.toString();
    if (ledger.user1.toString() !== myId && ledger.user2.toString() !== myId) return res.status(403).json({ message: 'Access denied' });

    const myUser = await User.findById(req.userId).select('name');
    const tx = { id: Date.now(), initiatorId: req.userId, initiatorName: myUser.name, type, amount, desc, date };
    ledger.transactions.push(tx);
    await ledger.save();
    res.json({ transaction: tx, transactions: ledger.transactions });
  } catch { res.status(500).json({ message: 'Failed to add transaction' }); }
});

// PUT /api/data/linked/:id/transaction/:txId  →  Edit transaction (initiator only)
router.put('/linked/:id/transaction/:txId', auth, async (req, res) => {
  try {
    const { amount, desc } = req.body;
    const ledger = await LinkedLedger.findById(req.params.id);
    if (!ledger) return res.status(404).json({ message: 'Not found' });
    const myId = req.userId.toString();
    const tx = ledger.transactions.find(t => t.id.toString() === req.params.txId);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    if (tx.initiatorId.toString() !== myId) return res.status(403).json({ message: 'Only creator can edit' });

    if (amount !== undefined) tx.amount = amount;
    if (desc   !== undefined) tx.desc   = desc;
    await ledger.save();
    res.json({ transactions: ledger.transactions });
  } catch { res.status(500).json({ message: 'Failed to edit' }); }
});

// DELETE /api/data/linked/:id/transaction/:txId  →  Delete (initiator only)
router.delete('/linked/:id/transaction/:txId', auth, async (req, res) => {
  try {
    const ledger = await LinkedLedger.findById(req.params.id);
    if (!ledger) return res.status(404).json({ message: 'Not found' });
    const myId = req.userId.toString();
    const tx = ledger.transactions.find(t => t.id.toString() === req.params.txId);
    if (!tx) return res.status(404).json({ message: 'Not found' });
    if (tx.initiatorId.toString() !== myId) return res.status(403).json({ message: 'Only creator can delete' });
    ledger.transactions = ledger.transactions.filter(t => t.id.toString() !== req.params.txId);
    await ledger.save();
    res.json({ transactions: ledger.transactions });
  } catch { res.status(500).json({ message: 'Failed to delete' }); }
});

// POST /api/data/linked/:id/chat  →  Send message
router.post('/linked/:id/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message required' });
    const ledger = await LinkedLedger.findById(req.params.id);
    if (!ledger) return res.status(404).json({ message: 'Not found' });
    const myId = req.userId.toString();
    if (ledger.user1.toString() !== myId && ledger.user2.toString() !== myId) return res.status(403).json({ message: 'Access denied' });
    const myUser = await User.findById(req.userId).select('name');
    ledger.chat.push({ senderId: req.userId, senderName: myUser.name, message: message.trim(), timestamp: new Date() });
    if (ledger.chat.length > 200) ledger.chat = ledger.chat.slice(-200);
    await ledger.save();
    res.json({ chat: ledger.chat });
  } catch { res.status(500).json({ message: 'Failed to send' }); }
});

// GET /api/data/linked/:id/chat  →  Poll chat
router.get('/linked/:id/chat', auth, async (req, res) => {
  try {
    const ledger = await LinkedLedger.findById(req.params.id).select('chat user1 user2');
    if (!ledger) return res.status(404).json({ message: 'Not found' });
    const myId = req.userId.toString();
    if (ledger.user1.toString() !== myId && ledger.user2.toString() !== myId) return res.status(403).json({ message: 'Access denied' });
    res.json({ chat: ledger.chat });
  } catch { res.status(500).json({ message: 'Failed to get chat' }); }
});

module.exports = router;
