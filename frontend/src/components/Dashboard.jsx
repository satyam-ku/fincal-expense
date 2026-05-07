import React, { useState, useEffect, useCallback } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

// ── helpers ──────────────────────────────────────────────────────────────────
function formatMoney(amount) {
  return new Intl.NumberFormat('en-IN').format(Math.round(amount));
}

function getIconForExpense(name) {
  const n = name.toLowerCase();
  if (n.includes('food') || n.includes('lunch') || n.includes('dinner') || n.includes('breakfast') || n.includes('restaurant') || n.includes('snack')) return 'fa-utensils';
  if (n.includes('coffee') || n.includes('cafe') || n.includes('tea') || n.includes('chai')) return 'fa-mug-hot';
  if (n.includes('grocery') || n.includes('supermarket') || n.includes('mart') || n.includes('fruit') || n.includes('veg')) return 'fa-shopping-basket';
  if (n.includes('taxi') || n.includes('fuel') || n.includes('gas') || n.includes('petrol') || n.includes('uber') || n.includes('parking') || n.includes('service')) return 'fa-car';
  if (n.includes('bus') || n.includes('train') || n.includes('metro') || n.includes('subway') || n.includes('ticket')) return 'fa-bus';
  if (n.includes('flight') || n.includes('airline') || n.includes('air')) return 'fa-plane';
  if (n.includes('bill') || n.includes('recharge') || n.includes('electric') || n.includes('water') || n.includes('internet') || n.includes('wifi') || n.includes('mobile')) return 'fa-bolt';
  if (n.includes('rent') || n.includes('home') || n.includes('house') || n.includes('maintenance')) return 'fa-home';
  if (n.includes('amazon') || n.includes('flipkart') || n.includes('shopping') || n.includes('buy') || n.includes('store')) return 'fa-shopping-cart';
  if (n.includes('cloth') || n.includes('shoe') || n.includes('wear') || n.includes('jeans') || n.includes('shirt')) return 'fa-tshirt';
  if (n.includes('movie') || n.includes('cinema') || n.includes('netflix') || n.includes('prime') || n.includes('subscription')) return 'fa-film';
  if (n.includes('game') || n.includes('steam') || n.includes('playstation') || n.includes('xbox')) return 'fa-gamepad';
  if (n.includes('doctor') || n.includes('medical') || n.includes('pharmacy') || n.includes('hospital')) return 'fa-notes-medical';
  if (n.includes('gym') || n.includes('fitness') || n.includes('yoga') || n.includes('sport')) return 'fa-dumbbell';
  if (n.includes('hotel') || n.includes('stay') || n.includes('bnb') || n.includes('trip')) return 'fa-suitcase';
  if (n.includes('transfer') || n.includes('send') || n.includes('atm') || n.includes('withdraw')) return 'fa-exchange-alt';
  if (n.includes('salary') || n.includes('income') || n.includes('deposit')) return 'fa-money-bill-wave';
  return 'fa-receipt';
}

// ── ConfirmModal ──────────────────────────────────────────────────────────────
function ConfirmModal({ config, onYes, onNo }) {
  if (!config) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
      <div className="glass-panel w-full max-w-xs p-8 rounded-[30px] border border-white/20 text-center animate-pop-in">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mx-auto flex items-center justify-center mb-6">
          <i className="fa-solid fa-triangle-exclamation text-2xl text-red-500"></i>
        </div>
        <h3 className="text-white font-bold text-lg mb-2 uppercase tracking-tight">{config.title}</h3>
        <p className="text-gray-400 text-xs mb-8 leading-relaxed">{config.message}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onNo} className="py-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold text-xs uppercase tracking-widest hover:bg-white/10">Cancel</button>
          <button onClick={onYes} className="py-3.5 rounded-xl bg-red-500 text-white font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform">Confirm</button>
        </div>
      </div>
    </div>
  );
}

function useConfirm() {
  const [config, setConfig] = useState(null);
  const [resolver, setResolver] = useState(null);
  const confirm = (title, message) => new Promise(resolve => { setConfig({ title, message }); setResolver(() => resolve); });
  const handleYes = () => { resolver(true); setConfig(null); };
  const handleNo = () => { resolver(false); setConfig(null); };
  return { config, confirm, handleYes, handleNo };
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout: authLogout } = useAuth();
  const { config, confirm, handleYes, handleNo } = useConfirm();

  const [currentTab, setCurrentTab] = useState('expenses');
  const [expensesData, setExpensesData] = useState({ budget: 0, list: [], lastActiveMonth: '', historyStats: {} });
  const [peopleData, setPeopleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [expSearchQuery, setExpSearchQuery] = useState('');

  // People state
  const [currentAddMode, setCurrentAddMode] = useState(null);
  const [newPersonName, setNewPersonName] = useState('');
  const [interestType, setInterestType] = useState('simple');
  const [interestRate, setInterestRate] = useState('');
  const [interestTime, setInterestTime] = useState('');
  const [interestTimeUnit, setInterestTimeUnit] = useState('years');
  const [interestFreq, setInterestFreq] = useState('monthly');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);

  // Person detail overlay
  const [activePersonId, setActivePersonId] = useState(null);
  const [showPersonOverlay, setShowPersonOverlay] = useState(false);
  const [activeTxType, setActiveTxType] = useState(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txDesc, setTxDesc] = useState('');
  const [txAmt, setTxAmt] = useState('');
  const [personTxSearch, setPersonTxSearch] = useState('');

  // Edit interest modal
  const [showEditInterest, setShowEditInterest] = useState(false);
  const [editInterestType, setEditInterestType] = useState('simple');
  const [editInterestRate, setEditInterestRate] = useState('');
  const [editInterestTime, setEditInterestTime] = useState('');
  const [editInterestTimeUnit, setEditInterestTimeUnit] = useState('years');
  const [editInterestFreq, setEditInterestFreq] = useState('monthly');

  // Stats & History modals
  const [showMonthlyStats, setShowMonthlyStats] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [statsTitle, setStatsTitle] = useState('');
  const [statsContent, setStatsContent] = useState(null);
  const [historyContent, setHistoryContent] = useState(null);
  const [historyTitle, setHistoryTitle] = useState('');
  const [showManual, setShowManual] = useState(false);

  // Expense inputs
  const [expName, setExpName] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [budgetInput, setBudgetInput] = useState('');

  // User search state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Add-person autocomplete (normal mode)
  const [addPersonSuggestions, setAddPersonSuggestions] = useState([]);
  const [addPersonSearchLoading, setAddPersonSearchLoading] = useState(false);
  const [selectedLinkedUser, setSelectedLinkedUser] = useState(null);

  // Linked ledger overlay
  const [linkedLedger, setLinkedLedger] = useState(null);
  const [linkedChatInput, setLinkedChatInput] = useState('');
  const [linkedChatLoading, setLinkedChatLoading] = useState(false);
  const [linkedOverlayTab, setLinkedOverlayTab] = useState('transactions');

  // Linked balances (ledgerId → balance) for People tab cards
  const [linkedBalances, setLinkedBalances] = useState({});

  // Edit transaction modal (linked)
  const [showLinkedEdit, setShowLinkedEdit] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [editTxDesc, setEditTxDesc] = useState('');
  const [editTxAmt, setEditTxAmt] = useState('');


  // ── Load data from API ──
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expRes, peopleRes] = await Promise.all([
          API.get('/data/expenses'),
          API.get('/data/people')
        ]);
        const expData = { budget: 0, list: [], lastActiveMonth: '', historyStats: {}, ...expRes.data };
        const currentMonthName = new Date().toLocaleDateString('en-IN', { month: 'short' });
        if (expData.lastActiveMonth && expData.lastActiveMonth !== currentMonthName) {
          const prevSpent = expData.list.filter(i => i.date.includes(expData.lastActiveMonth)).reduce((s, i) => s + i.amount, 0);
          if (!expData.historyStats) expData.historyStats = {};
          expData.historyStats[expData.lastActiveMonth] = { limit: expData.budget, spent: prevSpent };
          expData.budget = 0;
        }
        expData.lastActiveMonth = currentMonthName;
        setExpensesData(expData);
        setBudgetInput(expData.budget || '');

        let people = peopleRes.data;
        if (!people.some(x => x.id === 'myself')) {
          people = [{ id: 'myself', name: 'Myself', transactions: [], interestMode: 'none', isGroup: false, members: [], isGeneral: false }, ...people];
        }
        setPeopleData(people);

        // Load all linked balances in one call
        try {
          const balRes = await API.get('/data/linked-balances');
          setLinkedBalances(balRes.data.balances || {});
        } catch { /* not critical */ }
      } catch (err) { console.error('Load error', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);


  // ── Save to API ──
  const saveExpenses = useCallback(async (data) => {
    try { await API.put('/data/expenses', data); } catch (err) { console.error('Save expenses error', err); }
  }, []);

  const savePeople = useCallback(async (data) => {
    try { await API.put('/data/people', { people: data }); } catch (err) { console.error('Save people error', err); }
  }, []);

  // ── Budget ──
  const handleSetBudget = () => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val >= 0) {
      const updated = { ...expensesData, budget: val };
      setExpensesData(updated);
      saveExpenses(updated);
    }
  };

  // ── Add Expense ──
  const addExpense = () => {
    if (!expName.trim() || isNaN(parseFloat(expAmount)) || parseFloat(expAmount) <= 0) return;
    const amt = parseFloat(expAmount);
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const newItem = { id: Date.now(), name: expName, amount: amt, date: dateStr, icon: getIconForExpense(expName) };
    const updated = { ...expensesData, list: [newItem, ...expensesData.list] };
    setExpensesData(updated);
    saveExpenses(updated);
    setExpName(''); setExpAmount('');
  };

  const deleteExpense = async (id) => {
    if (await confirm('Delete Expense', 'Remove this expense permanently?')) {
      const updated = { ...expensesData, list: expensesData.list.filter(e => e.id !== id) };
      setExpensesData(updated);
      saveExpenses(updated);
    }
  };

  // ── Export CSV ──
  const exportCSV = () => {
    let csv = "Date,Name,Amount\n";
    expensesData.list.forEach(item => { csv += `"${item.date}","${item.name}",${item.amount}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${user.name}_expenses.csv`; a.click();
  };

  const exportPersonCSV = () => {
    const p = peopleData.find(x => x.id === activePersonId); if (!p || p.isGroup) return;
    let csv = "Date,Type,Description,Amount\n";
    p.transactions.forEach(t => { csv += `"${t.date}",${t.type},"${t.desc || ''}",${t.amount}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${p.name}_ledger.csv`; a.click();
  };

  // ── Reset Expenses ──
  const resetExpenses = async () => {
    if (await confirm('Clear Log', 'Wipe all expenses for this month?')) {
      const updated = { ...expensesData, list: [] };
      setExpensesData(updated);
      saveExpenses(updated);
    }
  };

  // ── People ──
  const openAddPersonMode = (mode) => {
    setCurrentAddMode(mode); setNewPersonName(''); setInterestRate(''); setInterestTime(''); setSelectedGroupMembers([]);
  };
  const cancelAddPerson = () => setCurrentAddMode(null);

  const confirmAddPerson = () => {
    if (!newPersonName.trim()) return;
    let personObj = { id: Date.now(), name: newPersonName, transactions: [], interestMode: 'none', interestRate: 0, timeValue: 0, timeUnit: 'years', interestFreq: 'yearly', isGroup: false, members: [], isGeneral: false };
    if (currentAddMode === 'general') personObj.isGeneral = true;
    else if (currentAddMode === 'interest') {
      const rate = parseFloat(interestRate); const timeVal = parseFloat(interestTime);
      if (isNaN(rate) || rate < 0 || isNaN(timeVal) || timeVal < 0) return alert('Valid rate and duration required');
      personObj.interestMode = interestType; personObj.interestRate = rate; personObj.timeValue = timeVal; personObj.timeUnit = interestTimeUnit; personObj.interestFreq = interestFreq;
    } else if (currentAddMode === 'group') {
      if (selectedGroupMembers.length < 2) return alert('Select at least 2 members');
      personObj.isGroup = true; personObj.members = selectedGroupMembers;
    }
    const updated = [...peopleData, personObj];
    setPeopleData(updated); savePeople(updated); setCurrentAddMode(null);
  };

  const deletePerson = async () => {
    if (activePersonId === 'myself') return alert("Cannot delete 'Myself' ledger.");
    if (await confirm('Delete Ledger', 'Delete this ledger and all history?')) {
      const updated = peopleData.filter(x => x.id !== activePersonId);
      setPeopleData(updated); savePeople(updated); setShowPersonOverlay(false);
    }
  };

  const clearPersonHistory = async () => {
    const p = peopleData.find(x => x.id === activePersonId); if (!p || p.isGroup) return alert('Cannot clear group history directly.');
    if (await confirm('Clear History', `Delete all transactions with ${p.name}?`)) {
      const updated = peopleData.map(x => x.id === activePersonId ? { ...x, transactions: [] } : x);
      setPeopleData(updated); savePeople(updated);
    }
  };

  // ── Transactions ──
  const submitPersonTx = () => {
    const amt = parseFloat(txAmt); if (isNaN(amt) || amt <= 0) return;
    const p = peopleData.find(x => x.id === activePersonId);
    const now = Date.now(); const d = new Date();
    const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    let updatedPeople = [...peopleData];
    let updatedExpenses = { ...expensesData };

    if (activeTxType === 'GAVE') {
      const isNormalPerson = !p.isGroup && (!p.interestMode || p.interestMode === 'none');
      if ((isNormalPerson || p.id === 'myself' || p.isGroup) && !p.isGeneral) {
        const newExp = { id: Date.now() + 1, name: `subtracted from ${p.name}`, amount: amt, date: dateStr, icon: 'fa-money-bill-transfer' };
        updatedExpenses = { ...expensesData, list: [newExp, ...expensesData.list] };
        setExpensesData(updatedExpenses);
        saveExpenses(updatedExpenses);
      }
    }

    if (p.isGroup) {
      const splitAmt = amt / p.members.length;
      updatedPeople = updatedPeople.map(person => {
        if (p.members.includes(person.id)) {
          return { ...person, transactions: [...person.transactions, { id: now + Math.random(), type: activeTxType, amount: splitAmt, desc: `(Group: ${p.name}) ${txDesc}`, date: dateStr }] };
        }
        return person;
      });
    } else {
      updatedPeople = updatedPeople.map(person => {
        if (person.id === activePersonId) return { ...person, transactions: [...person.transactions, { id: now, type: activeTxType, amount: amt, desc: txDesc, date: dateStr }] };
        return person;
      });
    }

    setPeopleData(updatedPeople); savePeople(updatedPeople);
    setShowTxModal(false); setTxDesc(''); setTxAmt('');
  };

  const deleteTx = async (txId) => {
    if (await confirm('Delete Record', 'Delete this transaction permanently?')) {
      const updated = peopleData.map(x => x.id === activePersonId ? { ...x, transactions: x.transactions.filter(t => t.id !== txId) } : x);
      setPeopleData(updated); savePeople(updated);
    }
  };

  // ── Update Interest ──
  const updateInterestDetails = () => {
    const rate = parseFloat(editInterestRate); const timeVal = parseFloat(editInterestTime);
    if (isNaN(rate) || rate < 0 || isNaN(timeVal) || timeVal < 0) return alert('Invalid inputs');
    const updated = peopleData.map(x => x.id === activePersonId ? { ...x, interestMode: editInterestType, interestRate: rate, timeValue: timeVal, timeUnit: editInterestTimeUnit, interestFreq: editInterestFreq } : x);
    setPeopleData(updated); savePeople(updated); setShowEditInterest(false);
  };

  // ── Logout ──
  const handleLogout = async () => {
    if (await confirm('Logout', 'Are you sure you want to exit?')) authLogout();
  };

  // ── User Search (People tab standalone) ──
  useEffect(() => {
    if (userSearchQuery.trim().length < 2) { setUserSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await API.get(`/auth/users/search?q=${userSearchQuery}`);
        setUserSearchResults(res.data.users);
      } catch { setUserSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  // ── Add-person autocomplete (debounced, only in normal mode) ──
  useEffect(() => {
    if (currentAddMode !== 'normal' || newPersonName.trim().length < 2) {
      setAddPersonSuggestions([]); return;
    }
    const timer = setTimeout(async () => {
      setAddPersonSearchLoading(true);
      try {
        const res = await API.get(`/auth/users/search?q=${newPersonName.trim()}`);
        // Exclude already-linked users
        const alreadyLinked = peopleData.filter(p => p.isLinked).map(p => p.linkedUserId?.toString());
        setAddPersonSuggestions(res.data.users.filter(u => !alreadyLinked.includes(u._id)));
      } catch { setAddPersonSuggestions([]); }
      finally { setAddPersonSearchLoading(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [newPersonName, currentAddMode, peopleData]);

  // ── Load linked ledger (with month rollover) ──
  const loadLinkedLedger = useCallback(async (ledgerId) => {
    try {
      const res = await API.get(`/data/linked/${ledgerId}`);
      const data = res.data;
      const currentM = new Date().toLocaleDateString('en-IN', { month: 'short' });
      // Month rollover: if last month differs, archive and clear
      if (data.lastActiveMonth && data.lastActiveMonth !== currentM && data.transactions.length > 0) {
        const rolled = await API.post(`/data/linked/${ledgerId}/rollover`, { month: currentM });
        setLinkedLedger(rolled.data);
      } else {
        if (data.lastActiveMonth !== currentM) {
          await API.post(`/data/linked/${ledgerId}/rollover`, { month: currentM });
        }
        setLinkedLedger(data);
      }
    } catch (err) { console.error('Linked ledger load error', err); }
  }, []);

  // ── Delete linked ledger (unlink both users) ──
  const deleteLinkedLedger = async () => {
    const p = peopleData.find(x => x.id === activePersonId); if (!p?.isLinked) return;
    if (!await confirm('Unlink Ledger', `Remove linked ledger with ${p.name}? This deletes all shared transactions and chat.`)) return;
    try {
      await API.delete(`/data/link/${p.linkedLedgerId}`);
      const updated = peopleData.filter(x => x.id !== activePersonId);
      setPeopleData(updated);
      const newBal = { ...linkedBalances }; delete newBal[p.linkedLedgerId?.toString()]; setLinkedBalances(newBal);
      setShowPersonOverlay(false);
    } catch (err) { alert(err.response?.data?.message || 'Failed to unlink'); }
  };

  // ── Submit linked transaction ──
  const submitLinkedTx = async () => {
    const amt = parseFloat(txAmt); if (isNaN(amt) || amt <= 0) return;
    const p = peopleData.find(x => x.id === activePersonId); if (!p?.isLinked) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' +
      now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    try {
      const res = await API.post(`/data/linked/${p.linkedLedgerId}/transaction`,
        { type: activeTxType, amount: amt, desc: txDesc, date: dateStr });
      const newTxs = res.data.transactions;
      setLinkedLedger(prev => ({ ...prev, transactions: newTxs }));
      syncLinkedBalance(newTxs, p.linkedLedgerId);
    } catch (err) { alert(err.response?.data?.message || 'Failed to add transaction'); }
    setShowTxModal(false); setTxDesc(''); setTxAmt('');
  };


  // ── Delete linked transaction ──
  const deleteLinkedTx = async (txId) => {
    if (!await confirm('Delete Record', 'Delete this transaction permanently?')) return;
    const p = peopleData.find(x => x.id === activePersonId); if (!p?.isLinked) return;
    try {
      const res = await API.delete(`/data/linked/${p.linkedLedgerId}/transaction/${txId}`);
      const newTxs = res.data.transactions;
      setLinkedLedger(prev => ({ ...prev, transactions: newTxs }));
      syncLinkedBalance(newTxs, p.linkedLedgerId); // ← refresh card balance
    } catch (err) { alert(err.response?.data?.message || 'Cannot delete'); }
  };

  // ── Edit linked transaction ──
  const openEditLinkedTx = (tx) => { setEditingTx(tx); setEditTxDesc(tx.desc || ''); setEditTxAmt(tx.amount); setShowLinkedEdit(true); };
  const submitEditLinkedTx = async () => {
    const amt = parseFloat(editTxAmt); if (isNaN(amt) || amt <= 0) return;
    const p = peopleData.find(x => x.id === activePersonId); if (!p?.isLinked) return;
    try {
      const res = await API.put(`/data/linked/${p.linkedLedgerId}/transaction/${editingTx.id}`, { amount: amt, desc: editTxDesc });
      const newTxs = res.data.transactions;
      setLinkedLedger(prev => ({ ...prev, transactions: newTxs }));
      syncLinkedBalance(newTxs, p.linkedLedgerId); // ← refresh card balance
    } catch (err) { alert(err.response?.data?.message || 'Edit failed'); }
    setShowLinkedEdit(false);
  };


  // ── Export linked ledger CSV ──
  const exportLinkedCSV = () => {
    const p = peopleData.find(x => x.id === activePersonId); if (!p || !linkedLedger) return;
    let csv = 'Date,Initiator,Type,Description,Amount\n';
    linkedLedger.transactions.forEach(t => { csv += `"${t.date}","${t.initiatorName}",${t.type},"${t.desc || ''}",${t.amount}\n`; });
    if (linkedLedger.monthlyHistory) {
      linkedLedger.monthlyHistory.forEach(mh => mh.transactions.forEach(t => { csv += `"${t.date}","${t.initiatorName}",${t.type},"${t.desc || ''}",${t.amount}\n`; }));
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${p.name}_linked_ledger.csv`; a.click();
  };

  // ── Linked monthly stats ──
  const showLinkedMonthlyStats = () => {
    if (!linkedLedger) return;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const stats = {};
    const addToStats = (txs) => txs.forEach(t => {
      const parts = t.date.split(' '); let m = '';
      if (parts.length > 1) { const mm = parts[1].replace(',',''); if (months.includes(mm)) m = mm; }
      if (m) {
        if (!stats[m]) stats[m] = { gave: 0, got: 0 };
        const isMine = t.initiatorId === user?.id || t.initiatorId?.toString() === user?.id?.toString();
        if (isMine) { if (t.type === 'GAVE') stats[m].gave += t.amount; else stats[m].got += t.amount; }
        else { if (t.type === 'GAVE') stats[m].got += t.amount; else stats[m].gave += t.amount; }
      }
    });
    addToStats(linkedLedger.transactions);
    if (linkedLedger.monthlyHistory) linkedLedger.monthlyHistory.forEach(mh => addToStats(mh.transactions));
    const sorted = Object.keys(stats).sort((a,b) => months.indexOf(a) - months.indexOf(b));
    setStatsTitle('Monthly Breakdown');
    setStatsContent(sorted.length === 0
      ? <p className="text-center text-sm text-gray-500 py-6 uppercase tracking-widest">No Data</p>
      : sorted.map(m => (
        <div key={m} className="bg-white/5 p-4 rounded-xl border border-white/5">
          <span className="text-sm font-bold text-white uppercase tracking-widest block mb-2">{m}</span>
          <div className="flex justify-between text-xs">
            <span className="text-neonBlue">You gave: ₹{formatMoney(stats[m].gave)}</span>
            <span className="text-red-400">You got: ₹{formatMoney(stats[m].got)}</span>
          </div>
        </div>
      ))
    );
    setShowMonthlyStats(true);
  };

  // ── Linked history (current month + all archived months) ──
  const showLinkedHistory = () => {
    if (!linkedLedger) return;
    const currentM = new Date().toLocaleDateString('en-IN', { month: 'short' });

    // Build sections: current month first, then archived
    const sections = [];

    // Current month
    if (linkedLedger.transactions && linkedLedger.transactions.length > 0) {
      sections.push({ month: `${currentM} (Current)`, transactions: linkedLedger.transactions });
    }

    // Archived months
    if (linkedLedger.monthlyHistory && linkedLedger.monthlyHistory.length > 0) {
      [...linkedLedger.monthlyHistory].reverse().forEach(mh => sections.push(mh));
    }

    setHistoryTitle('Transaction History');
    if (sections.length === 0) {
      setHistoryContent(<p className="text-center text-sm text-gray-500 py-6 uppercase tracking-widest">No Transactions Yet</p>);
    } else {
      setHistoryContent(sections.map((sec, i) => {
        const myTotal = sec.transactions.reduce((s, t) => {
          const isMine = t.initiatorId === user?.id || t.initiatorId?.toString() === user?.id?.toString();
          return s + (isMine ? (t.type === 'GAVE' ? t.amount : -t.amount) : (t.type === 'GAVE' ? -t.amount : t.amount));
        }, 0);
        return (
          <div key={i} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neonGreen uppercase tracking-widest">{sec.month}</span>
              <span className={`text-xs font-mono font-bold ${myTotal >= 0 ? 'text-neonBlue' : 'text-red-400'}`}>
                {myTotal >= 0 ? '+' : '-'}₹{formatMoney(Math.abs(myTotal))}
              </span>
            </div>
            {[...sec.transactions].reverse().map((t, j) => {
              const isMine = t.initiatorId === user?.id || t.initiatorId?.toString() === user?.id?.toString();
              const label = isMine ? (t.type === 'GAVE' ? 'You gave' : 'You got') : (t.type === 'GAVE' ? `${t.initiatorName} gave` : `${t.initiatorName} got`);
              return (
                <div key={j} className="bg-white/5 p-3 rounded-xl border border-white/5 mb-2 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-300 font-bold">{t.desc || label}</p>
                    <p className={`text-[10px] uppercase ${isMine && t.type === 'GAVE' ? 'text-neonGreen' : isMine ? 'text-red-400' : 'text-yellow-400'}`}>{label} • {t.date}</p>
                  </div>
                  <p className="text-sm font-mono text-white">₹{formatMoney(t.amount)}</p>
                </div>
              );
            })}
          </div>
        );
      }));
    }
    setShowHistoryModal(true);
  };


  // ── Send chat message ──
  const sendLinkedChat = async () => {
    if (!linkedChatInput.trim()) return;
    const p = peopleData.find(x => x.id === activePersonId); if (!p?.isLinked) return;
    setLinkedChatLoading(true);
    try {
      const res = await API.post(`/data/linked/${p.linkedLedgerId}/chat`, { message: linkedChatInput });
      setLinkedLedger(prev => ({ ...prev, chat: res.data.chat }));
      setLinkedChatInput('');
    } catch { /* silent */ }
    finally { setLinkedChatLoading(false); }
  };

  // ── Add linked user (from autocomplete) ──
  const confirmAddLinkedUser = async () => {
    if (!selectedLinkedUser) return;
    try {
      const res = await API.post('/data/link-user', { targetUserId: selectedLinkedUser._id });
      const updated = [...peopleData, res.data.person];
      setPeopleData(updated);
      setCurrentAddMode(null); setSelectedLinkedUser(null); setNewPersonName(''); setAddPersonSuggestions([]);
    } catch (err) { alert(err.response?.data?.message || 'Failed to link user'); }
  };

  // ── Linked balance helper (explicit Number cast to avoid string math bugs) ──
  const getLinkedBalance = (transactions) => {
    if (!transactions) return 0;
    const myId = user?.id?.toString();
    return transactions.reduce((bal, t) => {
      const amt = Number(t.amount) || 0;
      const isMine = t.initiatorId?.toString() === myId;
      // GAVE by me   → +amt (they owe me more)
      // GOT by me    → -amt (they owe me less / I repaid)
      // GAVE by them → -amt (I owe them more)
      // GOT by them  → +amt (I gave to them, they owe me more)
      return bal + (isMine ? (t.type === 'GAVE' ? amt : -amt)
                           : (t.type === 'GAVE' ? -amt : amt));
    }, 0);
  };

  // Shared helper to recalculate + sync card balance from a tx list
  const syncLinkedBalance = (txs, ledgerId) => {
    const bal = getLinkedBalance(txs);
    setLinkedBalances(prev => ({ ...prev, [ledgerId?.toString()]: bal }));
    return bal;
  };




  // ── Derived values ──
  const currentMonth = new Date().toLocaleDateString('en-IN', { month: 'short' });
  const liveMonthItems = expensesData.list.filter(i => i.date.includes(currentMonth));
  const liveMonthSpent = liveMonthItems.reduce((s, i) => s + i.amount, 0);
  const remaining = expensesData.budget - liveMonthSpent;
  const ringPercent = expensesData.budget > 0 ? (liveMonthSpent / expensesData.budget) * 100 : 0;
  const ringFill = Math.max(0, 100 - ringPercent);

  // Filtered expenses
  const filteredExpenses = expensesData.list.filter(item => {
    if (expSearchQuery) return item.name.toLowerCase().includes(expSearchQuery.toLowerCase()) || item.date.toLowerCase().includes(expSearchQuery.toLowerCase());
    return item.date.includes(currentMonth);
  });
  const displayExpenses = showAllExpenses ? filteredExpenses : filteredExpenses.slice(0, 10);

  // Normal + Linked receivable
  const linkedPositive = Object.values(linkedBalances).reduce((s, b) => s + (b > 0 ? b : 0), 0);
  const totalNormalReceivable = peopleData.reduce((sum, p) => {
    if (!p.isGroup && (!p.interestMode || p.interestMode === 'none') && p.id !== 'myself' && !p.isGeneral && !p.isLinked) {
      let bal = 0; p.transactions.forEach(t => bal += (t.type === 'GAVE' ? t.amount : -t.amount));
      if (bal > 0) return sum + bal;
    }
    return sum;
  }, 0) + linkedPositive;


  // Person detail values
  const activePerson = peopleData.find(x => x.id === activePersonId);
  const personPrincipal = activePerson && !activePerson.isGroup
    ? activePerson.transactions.reduce((s, t) => s + (t.type === 'GAVE' ? t.amount : -t.amount), 0) : 0;

  let personFinalAmount = personPrincipal;
  let interestAmount = 0;
  if (activePerson && activePerson.interestMode && activePerson.interestMode !== 'none' && Math.abs(personPrincipal) > 0) {
    let mpc = 1;
    if (activePerson.interestFreq === 'quarterly') mpc = 3;
    else if (activePerson.interestFreq === 'half-yearly') mpc = 6;
    else if (activePerson.interestFreq === 'yearly') mpc = 12;
    const durMonths = activePerson.timeUnit === 'years' ? activePerson.timeValue * 12 : activePerson.timeValue;
    const cycles = durMonths / mpc;
    const r = activePerson.interestRate / 100;
    const debt = Math.abs(personPrincipal);
    interestAmount = activePerson.interestMode === 'simple' ? debt * r * cycles : (debt * Math.pow((1 + r), cycles)) - debt;
    personFinalAmount = personPrincipal > 0 ? personPrincipal + interestAmount : personPrincipal - interestAmount;
  }

  const filteredPersonTx = activePerson && !activePerson.isGroup ? activePerson.transactions.filter(t => {
    if (personTxSearch) return (t.desc && t.desc.toLowerCase().includes(personTxSearch.toLowerCase())) || t.date.toLowerCase().includes(personTxSearch.toLowerCase()) || t.type.toLowerCase().includes(personTxSearch.toLowerCase());
    return t.date.includes(currentMonth);
  }).sort((a, b) => b.id - a.id) : [];

  // Monthly stats
  const buildMonthlyStats = (list) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const stats = {};
    list.forEach(item => {
      const parts = item.date.split(' '); let month = '';
      if (parts.length > 1) { const m = parts[1].replace(',', ''); if (months.includes(m)) month = m; }
      if (month) { if (!stats[month]) stats[month] = 0; stats[month] += item.amount; }
    });
    return { stats, months };
  };

  const showMonthlyStatsModal = () => {
    const { stats, months } = buildMonthlyStats(expensesData.list);
    const sorted = Object.keys(stats).sort((a, b) => months.indexOf(a) - months.indexOf(b));
    setStatsTitle('Monthly Breakdown');
    setStatsContent(sorted.length === 0
      ? <p className="text-center text-sm text-gray-500 py-6 uppercase tracking-widest">No Data Recorded</p>
      : sorted.map(m => (
        <div key={m} className="flex justify-between items-center bg-white/5 p-5 rounded-xl border border-white/5">
          <span className="text-base font-bold text-gray-300 uppercase tracking-widest">{m}</span>
          <span className="text-neonPurple font-mono font-bold text-lg">₹{formatMoney(stats[m])}</span>
        </div>
      ))
    );
    setShowMonthlyStats(true);
  };

  const showBudgetHistory = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentM = new Date().toLocaleDateString('en-IN', { month: 'short' });
    const currentItems = expensesData.list.filter(i => i.date.includes(currentM));
    const currentSpent = currentItems.reduce((s, i) => s + i.amount, 0);
    let allData = [];
    if (expensesData.historyStats) {
      const hs = expensesData.historyStats instanceof Map ? Object.fromEntries(expensesData.historyStats) : expensesData.historyStats;
      Object.keys(hs).forEach(m => { const h = hs[m]; allData.push({ month: m, limit: h.limit, spent: h.spent, balance: h.limit - h.spent }); });
    }
    if (!allData.find(d => d.month === currentM)) allData.push({ month: currentM, limit: expensesData.budget, spent: currentSpent, balance: expensesData.budget - currentSpent });
    allData.sort((a, b) => months.indexOf(b.month) - months.indexOf(a.month));
    setStatsTitle('Monthly Analytics');
    setStatsContent(allData.map(d => (
      <div key={d.month} className={`bg-white/5 p-5 rounded-xl border ${d.month === currentM ? 'border-neonBlue/30' : 'border-white/5'}`}>
        <div className="flex justify-between items-center mb-3">
          <span className="text-lg font-bold text-white uppercase tracking-widest">{d.month} {d.month === currentM && <span className="text-[9px] bg-neonBlue text-black px-1.5 py-0.5 rounded ml-2">LIVE</span>}</span>
          <span className="text-sm font-mono text-gray-400">Limit: ₹{formatMoney(d.limit)}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-[10px] text-gray-500 uppercase">Spent</p><p className="text-red-400 font-mono font-bold">₹{formatMoney(d.spent)}</p></div>
          <div className="text-right"><p className="text-[10px] text-gray-500 uppercase">Balance</p><p className="text-green-400 font-mono font-bold">₹{formatMoney(d.balance)}</p></div>
        </div>
      </div>
    )));
    setShowMonthlyStats(true);
  };

  const showHistoryView = (dataList, title) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const grouped = {};
    dataList.forEach(item => {
      const parts = item.date.split(' '); let month = '';
      if (parts.length > 1) { const m = parts[1].replace(',', ''); if (months.includes(m)) month = m; }
      if (month) { if (!grouped[month]) grouped[month] = []; grouped[month].push(item); }
    });
    const sortedMonths = Object.keys(grouped).sort((a, b) => months.indexOf(b) - months.indexOf(a));
    setHistoryTitle(title);
    if (sortedMonths.length === 0) { setHistoryContent(<p className="text-center text-sm text-gray-500 py-6 uppercase tracking-widest">No History Available</p>); }
    else {
      setHistoryContent(sortedMonths.map(m => {
        const monthTotal = grouped[m].reduce((s, t) => s + t.amount, 0);
        return (
          <MonthHistoryBlock key={m} month={m} items={grouped[m]} monthTotal={monthTotal} isExpense={title.includes('History') && !title.includes("'s")} />
        );
      }));
    }
    setShowHistoryModal(true);
  };

  const showPersonMonthlyStats = () => {
    const p = peopleData.find(x => x.id === activePersonId); if (!p || p.isGroup) return alert('Monthly stats for individual ledgers only.');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const stats = {};
    p.transactions.forEach(t => {
      const parts = t.date.split(' '); let month = '';
      if (parts.length > 1) { const m = parts[1].replace(',', ''); if (months.includes(m)) month = m; }
      if (month) { if (!stats[month]) stats[month] = { gave: 0, got: 0 }; if (t.type === 'GAVE') stats[month].gave += t.amount; else stats[month].got += t.amount; }
    });
    const sorted = Object.keys(stats).sort((a, b) => months.indexOf(a) - months.indexOf(b));
    setStatsTitle(`${p.name}'s Monthly`);
    setStatsContent(sorted.length === 0
      ? <p className="text-center text-sm text-gray-500 py-6 uppercase tracking-widest">No Transactions Found</p>
      : sorted.map(m => (
        <div key={m} className="bg-white/5 p-4 rounded-xl border border-white/5">
          <span className="text-base font-bold text-gray-300 uppercase tracking-widest block mb-2">{m}</span>
          <div className="flex justify-between text-xs">
            <span className="text-neonBlue">Gave: ₹{formatMoney(stats[m].gave)}</span>
            <span className="text-red-500">Got: ₹{formatMoney(stats[m].got)}</span>
          </div>
        </div>
      ))
    );
    setShowMonthlyStats(true);
  };

  // Group balance
  const getGroupBalance = (p) => {
    let bal = 0;
    p.members.forEach(mId => {
      const m = peopleData.find(x => x.id === mId);
      if (m) m.transactions.forEach(t => { if (t.desc && t.desc.startsWith(`(Group: ${p.name})`)) bal += (t.type === 'GAVE' ? t.amount : -t.amount); });
    });
    return bal;
  };

  if (loading) return (
    <div className="fixed inset-0 bg-[#020202] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-black text-white mb-4">FinCaL</h1>
        <div className="w-8 h-8 border-2 border-neonBlue border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );

  return (
    <div className="touch-pan-y">
      <ConfirmModal config={config} onYes={handleYes} onNo={handleNo} />

      {/* Header */}
      <header className="pt-8 pb-4 px-6 sticky top-0 z-40 bg-[#020202]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">Fin <span className="font-light text-gray-500 italic">CaL</span></h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{user?.name}</p>
          </div>
          <div className="flex gap-4 text-xs uppercase tracking-widest font-bold">
            <button onClick={() => setCurrentTab('expenses')} className={`tab-btn ${currentTab === 'expenses' ? 'active' : ''} px-3 py-2`}>Personal</button>
            <button onClick={() => setCurrentTab('people')} className={`tab-btn ${currentTab === 'people' ? 'active' : ''} px-3 py-2`}>People</button>
          </div>
          <button onClick={handleLogout} className="text-gray-600 hover:text-white transition w-10 h-10 flex items-center justify-center bg-white/5 rounded-full">
            <i className="fa-solid fa-power-off text-sm"></i>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 relative space-y-8 pb-20">
        {/* ── EXPENSES TAB ── */}
        {currentTab === 'expenses' && (
          <div className="flex flex-col gap-8 animate-pop-in">
            {/* Balance ring */}
            <div className="glass-panel rounded-[35px] p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neonBlue blur-[80px] opacity-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-neonPink blur-[80px] opacity-10"></div>
              <div className="relative z-10 grid grid-cols-2 gap-4 items-center">
                <div className="relative w-40 h-40 mx-auto">
                  <svg viewBox="0 0 36 36" className="block mx-auto max-w-full max-h-[250px]">
                    <path className="fill-none stroke-white/5" strokeWidth="2.5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="fill-none" strokeWidth="2.5" strokeLinecap="round" stroke={remaining < 0 ? '#ff3333' : '#00f3ff'}
                      strokeDasharray={`${ringFill}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      style={{ transition: 'stroke-dasharray 1s ease-out' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">Balance</span>
                    <span className="text-2xl font-bold font-mono text-white tracking-tight">₹{formatMoney(remaining)}</span>
                  </div>
                </div>
                <div className="text-right space-y-5">
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-1">Monthly Limit</p>
                    <div className="flex justify-end items-center gap-2">
                      <span className="text-gray-400 text-base">₹</span>
                      <input type="number" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} onBlur={handleSetBudget} onKeyDown={e => e.key === 'Enter' && handleSetBudget()}
                        placeholder="0" className="bg-transparent border-b border-gray-700 w-24 text-right text-white font-mono text-xl focus:outline-none focus:border-neonBlue transition-colors" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-1">Total Spent</p>
                    <p className="text-xl font-mono text-red-400 font-bold drop-shadow-[0_0_10px_rgba(255,50,50,0.4)]">₹{formatMoney(liveMonthSpent)}</p>
                    <button onClick={showBudgetHistory} className="text-[9px] text-neonBlue/80 hover:text-neonBlue underline uppercase tracking-widest mt-1">View Analytics</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Add expense */}
            <div className="glass-panel rounded-[30px] p-1 relative overflow-hidden">
              <div className="bg-black/40 rounded-[28px] p-6 text-center">
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <i className="fa-solid fa-tag absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 text-sm"></i>
                    <input type="text" value={expName} onChange={e => setExpName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addExpense()} placeholder="Expense Name..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-base focus:outline-none focus:border-neonGreen focus:bg-white/10 transition-all placeholder-gray-600" />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-3 relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neonGreen font-bold text-lg">₹</span>
                      <input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} onKeyDown={e => e.key === 'Enter' && addExpense()} placeholder="0"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-white font-mono text-xl focus:outline-none focus:border-neonGreen focus:bg-white/10 transition-all" />
                    </div>
                    <button onClick={addExpense} className="col-span-1 bg-neonGreen text-black rounded-xl flex items-center justify-center hover:bg-white transition-colors shadow-[0_0_15px_rgba(0,255,157,0.3)]">
                      <i className="fa-solid fa-plus text-2xl"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Expense list */}
            <div>
              <div className="flex flex-col gap-4 px-4 mb-3">
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Transaction Log</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button onClick={showMonthlyStatsModal} className="text-[10px] text-neonPurple/60 hover:text-neonPurple uppercase tracking-widest border border-neonPurple/20 px-3 py-2 rounded-md truncate"><i className="fa-solid fa-chart-pie mr-1"></i> Monthly</button>
                    <button onClick={() => showHistoryView(expensesData.list, 'Expense History')} className="text-[10px] text-neonGreen/60 hover:text-neonGreen uppercase tracking-widest border border-neonGreen/20 px-3 py-2 rounded-md truncate"><i className="fa-solid fa-clock-rotate-left mr-1"></i> History</button>
                    <button onClick={exportCSV} className="text-[10px] text-neonBlue/60 hover:text-neonBlue uppercase tracking-widest border border-neonBlue/20 px-3 py-2 rounded-md truncate"><i className="fa-solid fa-download mr-1"></i> Export</button>
                    <button onClick={resetExpenses} className="text-[10px] text-red-500/60 hover:text-red-400 uppercase tracking-widest border border-red-500/20 px-3 py-2 rounded-md truncate">Clear</button>
                  </div>
                </div>
                <div className="relative w-full">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs"></i>
                  <input type="text" value={expSearchQuery} onChange={e => { setExpSearchQuery(e.target.value); setShowAllExpenses(false); }} placeholder="SEARCH BY NAME OR DATE..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white uppercase tracking-widest focus:outline-none focus:border-neonBlue transition-all" />
                </div>
              </div>

              <div className="glass-panel rounded-[30px] overflow-hidden min-h-[300px]">
                {displayExpenses.length === 0 ? (
                  <div className="py-20 text-center">
                    <i className="fa-solid fa-box-open text-5xl text-gray-800 mb-3"></i>
                    <p className="text-xs text-gray-600 uppercase tracking-widest">{expSearchQuery ? 'No Match Found' : 'No Recent Data'}</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-white/5">
                      {displayExpenses.map(item => (
                        <div key={item.id} className="flex items-center justify-between px-6 py-5 hover:bg-white/[0.03] transition animate-slide-up">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neonBlue">
                              <i className={`fa-solid ${item.icon} text-lg`}></i>
                            </div>
                            <div>
                              <p className="text-gray-200 text-base font-medium">{item.name}</p>
                              <p className="text-xs font-bold text-neonBlue uppercase tracking-widest mt-0.5 opacity-80">{item.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-mono font-bold text-lg">₹{formatMoney(item.amount)}</p>
                            <button onClick={() => deleteExpense(item.id)} className="text-[10px] text-gray-600 hover:text-red-500 transition-colors uppercase">DEL</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {filteredExpenses.length > 10 && (
                      <div className="p-4 text-center border-t border-white/5">
                        <button onClick={() => setShowAllExpenses(p => !p)} className="text-[10px] text-neonBlue font-bold uppercase tracking-[0.2em] hover:text-white transition-colors">
                          {showAllExpenses ? 'Show Less' : 'Show More'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PEOPLE TAB ── */}
        {currentTab === 'people' && (
          <div className="flex flex-col gap-6 animate-pop-in">
            <button onClick={() => setShowManual(true)} className="w-full py-3 rounded-2xl bg-white/5 border border-yellow-400/30 text-yellow-400 font-bold text-xs uppercase tracking-[0.2em] hover:bg-yellow-400/10 transition flex items-center justify-center gap-2">
              <i className="fa-solid fa-circle-question text-base"></i>
              <span>How Ledger Categories Work</span>
            </button>

            {/* Normal receivable */}
            <div className="glass-panel p-6 rounded-[30px] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neonBlue/50 to-transparent"></div>
              <div className="flex justify-between items-end relative z-10">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total Owed To Me (Normal)</p>
                  <h2 className="text-3xl font-mono font-bold text-white">₹{formatMoney(totalNormalReceivable)}</h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-neonBlue/10 flex items-center justify-center border border-neonBlue/20 text-neonBlue">
                  <i className="fa-solid fa-hand-holding-dollar"></i>
                </div>
              </div>
            </div>

            {/* User Search Section */}
            <div className="glass-panel p-5 rounded-[24px] border border-white/10">
              <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Search App Users</h3>
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs"></i>
                <input type="text" value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)} placeholder="SEARCH BY NAME OR EMAIL..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white uppercase tracking-widest focus:outline-none focus:border-neonBlue transition-all" />
              </div>
              {searchLoading && <p className="text-center text-gray-500 text-xs mt-3 uppercase">Searching...</p>}
              {userSearchResults.length > 0 && (
                <div className="mt-3 space-y-2">
                  {userSearchResults.map(u => (
                    <div key={u._id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                      <div>
                        <p className="text-sm font-bold text-white">{u.name}</p>
                        <p className="text-[10px] text-gray-500">{u.email}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-neonBlue/10 border border-neonBlue/20 flex items-center justify-center text-neonBlue text-xs font-bold">
                        {u.name[0].toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {userSearchQuery.length >= 2 && !searchLoading && userSearchResults.length === 0 && (
                <p className="text-center text-gray-600 text-xs mt-3 uppercase tracking-widest">No users found</p>
              )}
            </div>

            {/* Add person buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { mode: 'normal', icon: 'fa-user-plus', color: 'text-neonBlue', label: 'Normal' },
                { mode: 'general', icon: 'fa-clipboard-list', color: 'text-yellow-400', label: 'General' },
                { mode: 'interest', icon: 'fa-percent', color: 'text-neonPurple', label: 'Interest' },
                { mode: 'group', icon: 'fa-users-viewfinder', color: 'text-neonGreen', label: 'Group' }
              ].map(({ mode, icon, color, label }) => (
                <button key={mode} onClick={() => openAddPersonMode(mode)} className="glass-panel p-4 rounded-[20px] flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition">
                  <i className={`fa-solid ${icon} ${color} text-xl`}></i>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
                </button>
              ))}
            </div>

            {/* Add person form */}
            {currentAddMode && (
              <div className="glass-panel rounded-[30px] p-1 animate-slide-up">
                <div className="bg-black/40 rounded-[28px] p-4">
                  <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3 ml-2">
                    {currentAddMode === 'general' ? 'Adding General Record' : currentAddMode === 'interest' ? 'Adding w/ Interest' : currentAddMode === 'group' ? 'Creating Group' : 'Adding Normal'}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {/* Name input with autocomplete for normal mode */}
                    <div className="relative">
                      <input type="text" value={newPersonName}
                        onChange={e => { setNewPersonName(e.target.value); setSelectedLinkedUser(null); }}
                        placeholder={currentAddMode === 'normal' ? 'Type name or search app users...' : 'Name or Group Title...'}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white text-base focus:outline-none focus:border-neonBlue w-full" />
                      {addPersonSearchLoading && <i className="fa-solid fa-circle-notch animate-spin absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>}
                    </div>

                    {/* Autocomplete suggestions (normal mode only) */}
                    {currentAddMode === 'normal' && addPersonSuggestions.length > 0 && !selectedLinkedUser && (
                      <div className="bg-black/80 border border-neonBlue/20 rounded-xl overflow-hidden">
                        <p className="text-[9px] text-neonBlue uppercase tracking-widest px-3 pt-2 pb-1">App Users — tap to link</p>
                        {addPersonSuggestions.map(u => (
                          <button key={u._id} type="button"
                            onClick={() => { setSelectedLinkedUser(u); setNewPersonName(u.name); setAddPersonSuggestions([]); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 transition text-left border-t border-white/5">
                            <div className="w-8 h-8 rounded-full bg-neonBlue/15 border border-neonBlue/30 flex items-center justify-center text-neonBlue text-xs font-bold shrink-0">
                              {u.name[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{u.name}</p>
                              <p className="text-[10px] text-gray-500">{u.email}</p>
                            </div>
                            <i className="fa-solid fa-link text-neonBlue/50 text-xs ml-auto"></i>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Selected linked user preview */}
                    {currentAddMode === 'normal' && selectedLinkedUser && (
                      <div className="flex items-center gap-3 bg-neonBlue/10 border border-neonBlue/30 rounded-xl px-3 py-2.5">
                        <div className="w-8 h-8 rounded-full bg-neonBlue/20 border border-neonBlue/40 flex items-center justify-center text-neonBlue text-xs font-bold">
                          {selectedLinkedUser.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{selectedLinkedUser.name}</p>
                          <p className="text-[10px] text-neonBlue">Will create a shared linked ledger</p>
                        </div>
                        <button type="button" onClick={() => { setSelectedLinkedUser(null); setNewPersonName(''); }}
                          className="text-gray-500 hover:text-white"><i className="fa-solid fa-xmark text-xs"></i></button>
                      </div>
                    )}

                    {currentAddMode === 'interest' && (
                      <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <select value={interestType} onChange={e => setInterestType(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white text-xs uppercase tracking-widest focus:outline-none">
                            <option value="simple" className="bg-black">Simple Int.</option>
                            <option value="compound" className="bg-black">Compound Int.</option>
                          </select>
                          <input type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="Rate %"
                            className="bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white text-base focus:outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex gap-1">
                            <input type="number" value={interestTime} onChange={e => setInterestTime(e.target.value)} placeholder="Duration"
                              className="bg-white/5 border border-white/10 rounded-l-xl px-4 h-12 text-white text-base focus:outline-none w-full" />
                            <select value={interestTimeUnit} onChange={e => setInterestTimeUnit(e.target.value)} className="bg-white/5 border border-white/10 border-l-0 rounded-r-xl px-2 h-12 text-white text-xs uppercase focus:outline-none w-20">
                              <option value="years" className="bg-black">Yrs</option>
                              <option value="months" className="bg-black">Mon</option>
                            </select>
                          </div>
                          <select value={interestFreq} onChange={e => setInterestFreq(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white text-xs uppercase tracking-widest focus:outline-none">
                            <option value="monthly" className="bg-black">Monthly</option>
                            <option value="quarterly" className="bg-black">Quarterly</option>
                            <option value="half-yearly" className="bg-black">Half Yearly</option>
                            <option value="yearly" className="bg-black">Yearly</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {currentAddMode === 'group' && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 ml-1">Select Members</p>
                        <div className="max-h-32 overflow-y-auto space-y-2 p-2 bg-white/5 rounded-xl border border-white/5">
                          {peopleData.filter(p => !p.isGroup && (!p.interestMode || p.interestMode === 'none') && !p.isGeneral).length === 0
                            ? <p className="text-center text-xs text-gray-500">No normal members found.</p>
                            : peopleData.filter(p => !p.isGroup && (!p.interestMode || p.interestMode === 'none') && !p.isGeneral).map(p => (
                              <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                                <input type="checkbox" checked={selectedGroupMembers.includes(p.id)}
                                  onChange={e => setSelectedGroupMembers(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id))}
                                  className="accent-neonGreen w-4 h-4" />
                                <span className="text-sm text-gray-300 font-bold">{p.name}</span>
                              </label>
                            ))
                          }
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-1">
                      <button onClick={cancelAddPerson} className="h-12 flex-1 rounded-xl border border-white/10 text-gray-500 text-xs font-bold uppercase tracking-widest hover:bg-white/5">Cancel</button>
                      {currentAddMode === 'normal' && selectedLinkedUser
                        ? <button onClick={confirmAddLinkedUser} className="h-12 flex-1 bg-neonBlue rounded-xl text-black font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:bg-white">Link User</button>
                        : <button onClick={confirmAddPerson} className="h-12 flex-1 bg-neonBlue rounded-xl text-black font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:bg-white">Save</button>
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* People grid */}
            {peopleData.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-24 h-24 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-5 border border-white/5">
                  <i className="fa-solid fa-users text-3xl text-gray-700"></i>
                </div>
                <p className="text-sm text-gray-600 uppercase tracking-widest">No Active Ledgers</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {peopleData.map(p => {
                  // Linked users: show balance from linkedBalances state (loaded at mount)
                  let bal = p.isLinked
                    ? (linkedBalances[p.linkedLedgerId?.toString()] || 0)
                    : (p.isGroup ? getGroupBalance(p) : p.transactions.reduce((s, t) => s + (t.type === 'GAVE' ? t.amount : -t.amount), 0));

                  let badge = null;
                  if (p.isLinked) badge = <span className="absolute top-4 right-4 text-[9px] text-neonBlue border border-neonBlue/40 px-2 py-0.5 rounded-full uppercase tracking-wider bg-black/60"><i className="fa-solid fa-link mr-1"></i>Linked</span>;
                  else if (p.isGroup) badge = <span className="absolute top-4 right-4 text-[9px] text-neonGreen border border-neonGreen/30 px-2 py-0.5 rounded-full uppercase tracking-wider bg-black/50">Group</span>;
                  else if (p.isGeneral) badge = <span className="absolute top-4 right-4 text-[9px] text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider bg-black/50">General</span>;
                  else if (p.interestMode && p.interestMode !== 'none') badge = <span className="absolute top-4 right-4 text-[9px] text-neonPurple border border-neonPurple/30 px-2 py-0.5 rounded-full uppercase tracking-wider bg-black/50">{p.interestMode}</span>;
                  else if (p.id === 'myself') badge = <span className="absolute top-4 right-4 text-[9px] text-white border border-white/30 px-2 py-0.5 rounded-full uppercase tracking-wider bg-black/50">Me</span>;
                  return (
                    <div key={p.id} onClick={() => {
                      setActivePersonId(p.id); setPersonTxSearch(''); setLinkedLedger(null);
                      setLinkedOverlayTab('transactions'); setShowPersonOverlay(true);
                      if (p.isLinked && p.linkedLedgerId) loadLinkedLedger(p.linkedLedgerId);
                    }}
                      className={`glass-panel p-6 rounded-[24px] border ${bal >= 0 ? 'border-neonBlue/20' : 'border-red-500/20'} cursor-pointer hover:scale-[1.02] transition-transform relative`}>
                      {badge}
                      <h3 className="text-xl font-bold">{p.name}</h3>
                      <p className={`text-3xl font-mono ${bal >= 0 ? 'text-neonBlue' : 'text-red-500'}`}>₹{formatMoney(Math.abs(bal))}</p>
                      {p.isLinked && <p className={`text-[10px] uppercase tracking-widest mt-1 ${bal > 0 ? 'text-neonBlue/60' : bal < 0 ? 'text-red-400/60' : 'text-gray-600'}`}>{bal > 0 ? 'Owes you' : bal < 0 ? 'You owe' : 'Settled'}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── LINKED PERSON OVERLAY ── */}
      {showPersonOverlay && activePerson?.isLinked && (
        <div className="fixed inset-0 z-50 bg-[#020202] flex flex-col h-full w-full overflow-hidden">
          {/* Header */}
          <div className="p-5 flex items-center justify-between border-b border-white/10 shrink-0">
            <button onClick={() => setShowPersonOverlay(false)} className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10">
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <div className="text-center">
              <h2 className="text-sm font-bold text-white tracking-widest uppercase">{activePerson.name}</h2>
              <p className="text-[10px] text-neonBlue uppercase tracking-widest"><i className="fa-solid fa-link mr-1"></i>Linked Ledger</p>
            </div>
            <button onClick={deleteLinkedLedger} className="w-11 h-11 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
              <i className="fa-solid fa-trash"></i>
            </button>

          </div>

          {/* Balance */}
          <div className="px-6 py-5 shrink-0">
            {!linkedLedger ? (
              <div className="flex items-center justify-center py-6">
                <i className="fa-solid fa-circle-notch animate-spin text-neonBlue text-2xl"></i>
              </div>
            ) : (() => {
              const bal = getLinkedBalance(linkedLedger.transactions);
              return (
                <div className="glass-panel p-5 rounded-[24px] flex items-center justify-between border border-neonBlue/20">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Net Balance</p>
                    <p className={`text-3xl font-mono font-bold ${bal >= 0 ? 'text-neonBlue' : 'text-red-400'}`}>₹{formatMoney(Math.abs(bal))}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-gray-400">
                      {bal > 0 ? `${activePerson.name} owes you` : bal < 0 ? 'You owe them' : 'Settled ✓'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setActiveTxType('GAVE'); setShowTxModal(true); }}
                      className="p-3 rounded-2xl bg-neonGreen/10 border border-neonGreen/30 text-center">
                      <i className="fa-solid fa-arrow-up text-neonGreen text-lg block mb-1"></i>
                      <p className="text-[9px] text-neonGreen font-bold uppercase">I Gave</p>
                    </button>

                    <button onClick={() => { setActiveTxType('GOT'); setShowTxModal(true); }}
                      className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-center">
                      <i className="fa-solid fa-arrow-down text-red-400 text-lg block mb-1"></i>
                      <p className="text-[9px] text-red-400 font-bold uppercase">I Got</p>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Tabs */}
          <div className="flex bg-white/5 rounded-2xl p-1 mx-6 mb-4 shrink-0">
            {['transactions', 'chat'].map(tab => (
              <button key={tab} onClick={() => setLinkedOverlayTab(tab)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                  ${linkedOverlayTab === tab ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>
                {tab === 'transactions' ? <><i className="fa-solid fa-list-ul mr-1.5"></i>Transactions</> : <><i className="fa-solid fa-comments mr-1.5"></i>Chat</>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            {linkedOverlayTab === 'transactions' && linkedLedger && (
              <div className="space-y-3">
                {/* Toolbar */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button onClick={showLinkedMonthlyStats} className="text-[10px] text-neonPurple/60 hover:text-neonPurple uppercase tracking-widest border border-neonPurple/20 px-2 py-2 rounded-lg"><i className="fa-solid fa-chart-pie mr-1"></i>Monthly</button>
                  <button onClick={showLinkedHistory} className="text-[10px] text-neonGreen/60 hover:text-neonGreen uppercase tracking-widest border border-neonGreen/20 px-2 py-2 rounded-lg"><i className="fa-solid fa-clock-rotate-left mr-1"></i>History</button>
                  <button onClick={exportLinkedCSV} className="text-[10px] text-neonBlue/60 hover:text-neonBlue uppercase tracking-widest border border-neonBlue/20 px-2 py-2 rounded-lg"><i className="fa-solid fa-download mr-1"></i>Export</button>
                </div>
                {linkedLedger.transactions.length === 0
                  ? <p className="text-center text-xs text-gray-500 py-10 uppercase tracking-widest">No transactions this month</p>
                  : [...linkedLedger.transactions].reverse().map(t => {
                      const isMine = t.initiatorId === user?.id || t.initiatorId?.toString() === user?.id?.toString();
                      const label = isMine
                        ? (t.type === 'GAVE' ? 'You gave' : 'You received')
                        : (t.type === 'GAVE' ? `${t.initiatorName} gave` : `${t.initiatorName} received`);
                      return (
                        <div key={t.id} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5 animate-slide-up">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${isMine && t.type === 'GAVE' ? 'bg-neonGreen/10 border-neonGreen/30 text-neonGreen' : isMine && t.type === 'GOT' ? 'bg-red-500/10 border-red-500/30 text-red-400' : !isMine && t.type === 'GAVE' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-neonBlue/10 border-neonBlue/30 text-neonBlue'}`}>
                              <i className={`fa-solid ${t.type === 'GAVE' ? 'fa-arrow-up' : 'fa-arrow-down'} text-sm`}></i>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-300">{t.desc || label}</p>
                              <p className={`text-[10px] font-bold uppercase ${isMine && t.type === 'GAVE' ? 'text-neonGreen' : isMine ? 'text-red-400' : 'text-yellow-400'}`}>{label} • {t.date}</p>
                            </div>

                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono font-bold text-white">₹{formatMoney(t.amount)}</p>
                            {isMine && (
                              <div className="flex gap-2 justify-end mt-0.5">
                                <button onClick={() => openEditLinkedTx(t)} className="text-[9px] text-gray-500 hover:text-neonBlue">EDIT</button>
                                <button onClick={() => deleteLinkedTx(t.id)} className="text-[9px] text-gray-600 hover:text-red-500">DEL</button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            )}


            {linkedOverlayTab === 'chat' && linkedLedger && (
              <div className="flex flex-col h-full">
                <div className="flex-1 space-y-3 pb-4">
                  {linkedLedger.chat.length === 0
                    ? <p className="text-center text-xs text-gray-500 py-10 uppercase tracking-widest">No messages yet. Say hi!</p>
                    : linkedLedger.chat.map((msg, i) => {
                        const isMine = msg.senderId === user?.id || msg.senderId?.toString() === user?.id?.toString();
                        return (
                          <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${isMine ? 'bg-neonBlue/20 border border-neonBlue/30 rounded-br-sm' : 'bg-white/5 border border-white/10 rounded-bl-sm'}`}>
                              {!isMine && <p className="text-[9px] text-neonBlue font-bold mb-1 uppercase">{msg.senderName}</p>}
                              <p className="text-sm text-white">{msg.message}</p>
                              <p className="text-[9px] text-gray-600 mt-1">{new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        );
                      })
                  }
                </div>
                {/* Chat input */}
                <div className="flex gap-2 sticky bottom-0 pt-3 bg-[#020202]/90 backdrop-blur">
                  <input type="text" value={linkedChatInput} onChange={e => setLinkedChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendLinkedChat()}
                    placeholder="Type a message..." maxLength={500}
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neonBlue transition-all" />
                  <button onClick={sendLinkedChat} disabled={linkedChatLoading || !linkedChatInput.trim()}
                    className="w-12 h-12 bg-neonBlue rounded-2xl text-black flex items-center justify-center disabled:opacity-40">
                    {linkedChatLoading ? <i className="fa-solid fa-circle-notch animate-spin text-sm"></i> : <i className="fa-solid fa-paper-plane text-sm"></i>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TX Modal for linked */}
          {showTxModal && (
            <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
              <div className="glass-panel w-full max-w-xs p-8 rounded-[30px] border border-white/20 text-center animate-pop-in">
                <h3 className="text-base font-bold mb-6 uppercase tracking-widest text-white">{activeTxType}</h3>
                <div className="space-y-5">
                  <input type="text" value={txDesc} onChange={e => setTxDesc(e.target.value)} placeholder="Description (e.g. Lunch)" className="input-glow w-full p-4 rounded-2xl text-base" />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                    <input type="number" value={txAmt} onChange={e => setTxAmt(e.target.value)} placeholder="0" className="input-glow w-full p-4 rounded-2xl font-mono text-2xl pl-10" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <button onClick={() => { setShowTxModal(false); setTxDesc(''); setTxAmt(''); }} className="py-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold text-xs hover:bg-white/10">CANCEL</button>
                    <button onClick={submitLinkedTx} className="py-3.5 rounded-xl bg-white text-black font-bold text-xs shadow-[0_0_20px_rgba(255,255,255,0.2)]">CONFIRM</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Edit Transaction Modal */}
          {showLinkedEdit && editingTx && (
            <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
              <div className="glass-panel w-full max-w-xs p-8 rounded-[30px] border border-white/20 text-center animate-pop-in">
                <h3 className="text-base font-bold mb-1 uppercase tracking-widest text-white">Edit Transaction</h3>
                <p className="text-[10px] text-neonBlue uppercase tracking-widest mb-6">{editingTx.type}</p>
                <div className="space-y-4">
                  <input type="text" value={editTxDesc} onChange={e => setEditTxDesc(e.target.value)}
                    placeholder="Description" className="input-glow w-full p-4 rounded-2xl text-sm text-left" />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                    <input type="number" value={editTxAmt} onChange={e => setEditTxAmt(e.target.value)}
                      className="input-glow w-full p-4 rounded-2xl font-mono text-2xl pl-10" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={() => setShowLinkedEdit(false)} className="py-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold text-xs">CANCEL</button>
                    <button onClick={submitEditLinkedTx} className="py-3.5 rounded-xl bg-neonBlue text-black font-bold text-xs shadow-[0_0_20px_rgba(0,243,255,0.2)]">SAVE</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ── PERSON DETAIL OVERLAY (regular/non-linked) ── */}
      {showPersonOverlay && activePerson && !activePerson.isLinked && (

        <div className="fixed inset-0 z-50 bg-[#020202] flex flex-col h-full w-full overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-white/10">
            <button onClick={() => setShowPersonOverlay(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10 hover:bg-white/10">
              <i className="fa-solid fa-arrow-left text-lg"></i>
            </button>
            <div className="text-center">
              <h2 className="text-base font-bold text-white tracking-widest uppercase">{activePerson.name}</h2>
              <p className="text-[11px] text-gray-500 uppercase tracking-widest">Ledger Details</p>
            </div>
            <button onClick={deletePerson} className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 hover:bg-red-500/20">
              <i className="fa-solid fa-trash text-lg"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center space-y-8">
            {/* Balance circle */}
            <div className="glass-panel p-10 rounded-full w-72 h-72 flex flex-col items-center justify-center relative border border-white/10 mt-6 shrink-0">
              <div className="absolute inset-0 rounded-full border border-white/5 animate-pulse-slow"></div>
              <p className="text-gray-500 text-xs uppercase tracking-[0.3em] mb-3">Net Standing</p>
              <div className="text-5xl font-mono font-bold text-white mb-2 tracking-tighter">₹{formatMoney(Math.abs(activePerson.isGroup ? getGroupBalance(activePerson) : personFinalAmount))}</div>
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center gap-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  {activePerson.isGroup
                    ? (getGroupBalance(activePerson) > 0 ? 'GROUP OWES' : getGroupBalance(activePerson) < 0 ? 'YOU OWE' : 'SETTLED')
                    : (personFinalAmount > 0 ? 'OWES YOU' : personFinalAmount < 0 ? 'YOU OWE' : 'SETTLED')}
                </p>
              </div>
            </div>

            {/* Interest card */}
            {activePerson.interestMode && activePerson.interestMode !== 'none' && Math.abs(personPrincipal) > 0 && (
              <div className="w-full max-w-sm glass-panel p-5 rounded-2xl border border-neonPurple/20 relative">
                <button onClick={() => {
                  setEditInterestType(activePerson.interestMode); setEditInterestRate(activePerson.interestRate);
                  setEditInterestTime(activePerson.timeValue); setEditInterestTimeUnit(activePerson.timeUnit);
                  setEditInterestFreq(activePerson.interestFreq); setShowEditInterest(true);
                }} className="absolute top-3 right-3 w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-gray-400">
                  <i className="fa-solid fa-pen text-xs"></i>
                </button>
                <div className="grid grid-cols-2 gap-y-3 text-[10px] uppercase tracking-widest">
                  <div className="text-gray-500">Principal</div><div className="text-right font-bold text-white text-xs">₹{formatMoney(Math.abs(personPrincipal))}</div>
                  <div className="text-gray-500">Rate</div><div className="text-right font-bold text-white">{activePerson.interestRate}% / {activePerson.interestFreq}</div>
                  <div className="text-gray-500">Interest</div><div className="text-right font-bold text-neonPurple text-sm">₹{formatMoney(interestAmount)}</div>
                </div>
              </div>
            )}

            {/* Group members */}
            {activePerson.isGroup && (
              <div className="w-full max-w-sm">
                <h4 className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 ml-2">Group Members</h4>
                <div className="space-y-2">
                  {activePerson.members.map(mId => {
                    const m = peopleData.find(x => x.id === mId);
                    if (!m) return null;
                    let mBal = 0; m.transactions.forEach(t => { if (t.desc && t.desc.startsWith(`(Group: ${activePerson.name})`)) mBal += (t.type === 'GAVE' ? t.amount : -t.amount); });
                    return (
                      <div key={mId} className="flex justify-between items-center bg-white/5 p-2 px-3 rounded-lg border border-white/5">
                        <span className="text-xs text-gray-300 font-bold">{m.name}</span>
                        <span className={`text-xs font-mono font-bold ${mBal >= 0 ? 'text-neonBlue' : 'text-red-500'}`}>₹{formatMoney(Math.abs(mBal))}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Transaction buttons */}
            {!activePerson.isGroup && (
              <div className="grid grid-cols-2 gap-5 w-full max-w-sm shrink-0">
                <button onClick={() => { setActiveTxType('GAVE'); setShowTxModal(true); }}
                  className="group relative overflow-hidden p-6 rounded-3xl bg-[#0a0505] border border-neonBlue/20 text-center transition-transform active:scale-95">
                  <i className="fa-solid fa-arrow-up text-neonBlue text-2xl mb-3"></i>
                  <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">I Gave</p>
                  <p className="text-[10px] text-neonBlue/60 mt-1">THEY OWE YOU</p>
                </button>
                <button onClick={() => { setActiveTxType('GOT'); setShowTxModal(true); }}
                  className="group relative overflow-hidden p-6 rounded-3xl bg-[#050a0a] border border-red-500/20 text-center transition-transform active:scale-95">
                  <i className="fa-solid fa-arrow-down text-red-500 text-2xl mb-3"></i>
                  <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">I Got</p>
                  <p className="text-[10px] text-red-500/60 mt-1">REPAYMENT</p>
                </button>
              </div>
            )}

            {activePerson.isGroup && (
              <div className="grid grid-cols-2 gap-5 w-full max-w-sm shrink-0">
                <button onClick={() => { setActiveTxType('GAVE'); setShowTxModal(true); }}
                  className="p-6 rounded-3xl bg-[#0a0505] border border-neonBlue/20 text-center transition-transform active:scale-95">
                  <i className="fa-solid fa-arrow-up text-neonBlue text-2xl mb-3"></i>
                  <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">Split Expense</p>
                  <p className="text-[10px] text-neonBlue/60 mt-1">DIVIDED AMONG MEMBERS</p>
                </button>
                <button onClick={() => { setActiveTxType('GOT'); setShowTxModal(true); }}
                  className="p-6 rounded-3xl bg-[#050a0a] border border-red-500/20 text-center transition-transform active:scale-95">
                  <i className="fa-solid fa-arrow-down text-red-500 text-2xl mb-3"></i>
                  <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">Split Repay</p>
                  <p className="text-[10px] text-red-500/60 mt-1">SPLIT REPAYMENT</p>
                </button>
              </div>
            )}

            {/* Transaction log */}
            <div className="w-full max-w-md pb-12 shrink-0">
              <div className="flex flex-col gap-4 px-2 mb-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs text-gray-600 font-bold uppercase tracking-widest">Transaction Log</h3>
                  <div className="flex gap-2">
                    <button onClick={showPersonMonthlyStats} className="text-[9px] text-neonPurple/60 hover:text-neonPurple uppercase tracking-widest border border-neonPurple/20 px-2.5 py-1 rounded-md"><i className="fa-solid fa-chart-pie mr-1"></i>Month</button>
                    <button onClick={() => { const p = peopleData.find(x => x.id === activePersonId); if (p && !p.isGroup) showHistoryView(p.transactions, `${p.name}'s History`); }} className="text-[9px] text-neonGreen/60 hover:text-neonGreen uppercase tracking-widest border border-neonGreen/20 px-2.5 py-1 rounded-md"><i className="fa-solid fa-clock-rotate-left mr-1"></i>Hist</button>
                    <button onClick={exportPersonCSV} className="text-[9px] text-neonBlue/60 hover:text-neonBlue uppercase tracking-widest border border-neonBlue/20 px-2.5 py-1 rounded-md"><i className="fa-solid fa-download mr-1"></i>Exp</button>
                    <button onClick={clearPersonHistory} className="text-[9px] text-red-500/60 hover:text-red-400 uppercase tracking-widest border border-red-500/20 px-2.5 py-1 rounded-md">Clear</button>
                  </div>
                </div>
                <div className="relative w-full">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 text-[10px]"></i>
                  <input type="text" value={personTxSearch} onChange={e => setPersonTxSearch(e.target.value)} placeholder="SEARCH LOG..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-[10px] text-white uppercase tracking-[0.2em] focus:outline-none focus:border-neonBlue transition-all" />
                </div>
              </div>

              <div className="space-y-4">
                {!activePerson.isGroup && filteredPersonTx.length === 0 && (
                  <p className="text-center text-xs text-gray-500 py-6 uppercase tracking-widest">{personTxSearch ? 'No Match Found' : 'No Recent Transactions'}</p>
                )}
                {!activePerson.isGroup && filteredPersonTx.map(t => (
                  <div key={t.id} className="bg-white/5 p-5 rounded-2xl flex justify-between items-center border border-white/5 animate-slide-up">
                    <div className="flex items-center gap-4">
                      <div className="text-center bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 w-auto min-w-[65px]">
                        <p className="text-xs font-black text-white uppercase leading-tight">{t.date}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-300">{t.desc || (t.type === 'GAVE' ? 'Sent Cash' : 'Received')}</p>
                        <p className={`text-[10px] font-bold uppercase ${t.type === 'GAVE' ? 'text-neonBlue' : 'text-red-400'}`}>{t.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-mono font-bold text-white">₹{formatMoney(t.amount)}</p>
                      <button onClick={() => deleteTx(t.id)} className="text-[10px] text-gray-600 hover:text-red-500">DEL</button>
                    </div>
                  </div>
                ))}
                {activePerson.isGroup && <p className="text-center text-xs text-gray-500 py-4">Transactions split in member ledgers.</p>}
              </div>
            </div>
          </div>

          {/* TX Input Modal */}
          {showTxModal && (
            <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
              <div className="glass-panel w-full max-w-xs p-8 rounded-[30px] border border-white/20 text-center animate-pop-in">
                <h3 className="text-base font-bold mb-6 uppercase tracking-widest text-white">{activeTxType}</h3>
                <div className="space-y-5">
                  <input type="text" value={txDesc} onChange={e => setTxDesc(e.target.value)} placeholder="Description (e.g. Lunch)" className="input-glow w-full p-4 rounded-2xl text-base" />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                    <input type="number" value={txAmt} onChange={e => setTxAmt(e.target.value)} placeholder="0" className="input-glow w-full p-4 rounded-2xl font-mono text-2xl pl-10" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <button onClick={() => { setShowTxModal(false); setTxDesc(''); setTxAmt(''); }} className="py-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold text-xs hover:bg-white/10">CANCEL</button>
                    <button onClick={submitPersonTx} className="py-3.5 rounded-xl bg-white text-black font-bold text-xs shadow-[0_0_20px_rgba(255,255,255,0.2)]">CONFIRM</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Interest Modal */}
      {showEditInterest && (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="glass-panel w-full max-w-sm p-6 rounded-[30px] border border-white/20 animate-pop-in">
            <h3 className="text-sm font-bold mb-6 uppercase tracking-widest text-center text-white">Edit Interest Details</h3>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <select value={editInterestType} onChange={e => setEditInterestType(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white text-xs uppercase tracking-widest focus:outline-none">
                  <option value="simple" className="bg-black">Simple Int.</option>
                  <option value="compound" className="bg-black">Compound Int.</option>
                </select>
                <input type="number" value={editInterestRate} onChange={e => setEditInterestRate(e.target.value)} placeholder="Rate %"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white text-base focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex gap-1">
                  <input type="number" value={editInterestTime} onChange={e => setEditInterestTime(e.target.value)} placeholder="Duration"
                    className="bg-white/5 border border-white/10 rounded-l-xl px-4 h-12 text-white text-base focus:outline-none w-full" />
                  <select value={editInterestTimeUnit} onChange={e => setEditInterestTimeUnit(e.target.value)} className="bg-white/5 border border-white/10 border-l-0 rounded-r-xl px-2 h-12 text-white text-xs uppercase focus:outline-none w-20">
                    <option value="years" className="bg-black">Yrs</option>
                    <option value="months" className="bg-black">Mos</option>
                  </select>
                </div>
                <select value={editInterestFreq} onChange={e => setEditInterestFreq(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white text-xs uppercase tracking-widest focus:outline-none">
                  <option value="monthly" className="bg-black">Monthly</option>
                  <option value="quarterly" className="bg-black">Quarterly</option>
                  <option value="half-yearly" className="bg-black">Half Yearly</option>
                  <option value="yearly" className="bg-black">Yearly</option>
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowEditInterest(false)} className="h-12 flex-1 rounded-xl border border-white/10 text-gray-500 text-xs font-bold uppercase tracking-widest hover:bg-white/5">Cancel</button>
                <button onClick={updateInterestDetails} className="h-12 flex-1 bg-neonPurple rounded-xl text-white font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform">Update</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Stats Modal */}
      {showMonthlyStats && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="glass-panel w-full max-w-sm p-8 rounded-[30px] border border-white/20 animate-pop-in flex flex-col max-h-[80vh]">
            <h3 className="text-base font-bold mb-6 uppercase tracking-widest text-center text-neonPurple">{statsTitle}</h3>
            <div className="overflow-y-auto flex-1 space-y-4 pr-2 custom-scrollbar">{statsContent}</div>
            <button onClick={() => setShowMonthlyStats(false)} className="mt-6 py-4 w-full rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold text-xs hover:bg-white/10 hover:text-white transition">CLOSE</button>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="glass-panel w-full max-w-md p-6 rounded-[30px] border border-white/20 animate-pop-in flex flex-col max-h-[85vh]">
            <h3 className="text-base font-bold mb-6 uppercase tracking-widest text-center text-neonGreen">{historyTitle}</h3>
            <div className="overflow-y-auto flex-1 space-y-3 pr-2 custom-scrollbar">{historyContent}</div>
            <button onClick={() => setShowHistoryModal(false)} className="mt-6 py-4 w-full rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold text-xs hover:bg-white/10 hover:text-white transition">CLOSE</button>
          </div>
        </div>
      )}

      {/* Manual Modal */}
      {showManual && (
        <div className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-lg flex items-center justify-center p-6">
          <div className="glass-panel w-full max-w-md p-6 rounded-[30px] border border-white/20 animate-pop-in flex flex-col max-h-[85vh]">
            <h3 className="text-lg font-extrabold mb-6 uppercase tracking-widest text-center text-white">How It Works</h3>
            <div className="overflow-y-auto flex-1 space-y-5 pr-2 custom-scrollbar">
              {[
                { icon: 'fa-user-plus', color: 'text-neonBlue', border: 'border-neonBlue/20', title: 'Normal', text: 'Personal debt tracker. Money recorded as "I GAVE" is automatically deducted from your Personal Budget. Use this for lending money to friends.' },
                { icon: 'fa-clipboard-list', color: 'text-yellow-400', border: 'border-yellow-400/20', title: 'General', text: 'Isolated record keeping. Transactions here do NOT affect your Personal Budget. Use for business records or money that doesn\'t come from your daily pocket.' },
                { icon: 'fa-percent', color: 'text-neonPurple', border: 'border-neonPurple/20', title: 'Interest', text: 'Investment tracker. Automatically calculates repayment based on Principal, Rate, Duration & Frequency. Supports Simple & Compound interest.' },
                { icon: 'fa-users-viewfinder', color: 'text-neonGreen', border: 'border-neonGreen/20', title: 'Group', text: 'Split-wise logic. Select members from your Normal list. Any transaction is divided equally and added to each member\'s individual ledger.' }
              ].map(({ icon, color, border, title, text }) => (
                <div key={title} className={`bg-white/5 p-4 rounded-2xl border ${border}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <i className={`fa-solid ${icon} ${color} text-lg`}></i>
                    <h4 className={`text-sm font-bold ${color} uppercase tracking-widest`}>{title}</h4>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowManual(false)} className="mt-6 py-4 w-full rounded-xl bg-white text-black font-bold text-xs hover:scale-[1.02] transition">GOT IT</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for history months
function MonthHistoryBlock({ month, items, monthTotal, isExpense }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
      <button onClick={() => setOpen(p => !p)} className="w-full flex justify-between items-center p-4 bg-white/5 hover:bg-white/10 transition">
        <div className="text-left">
          <span className="text-sm font-bold text-white uppercase tracking-widest block">{month}</span>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div>
            <span className="block text-neonGreen font-mono font-bold text-sm">₹{formatMoney(monthTotal)}</span>
            <span className="block text-[9px] text-gray-500 uppercase tracking-widest">{items.length} Txns</span>
          </div>
          <i className={`fa-solid fa-chevron-down text-gray-500 text-xs transition-transform ${open ? 'rotate-180' : ''}`}></i>
        </div>
      </button>
      {open && (
        <div className="p-2 bg-black/20">
          {items.map((t, i) => (
            <div key={i} className="flex justify-between items-center py-2 px-2 border-b border-white/5 last:border-0 pl-4">
              {isExpense ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-neonBlue/70">
                      <i className={`fa-solid ${t.icon} text-xs`}></i>
                    </div>
                    <div><p className="text-xs text-gray-300 font-bold">{t.name}</p><p className="text-[9px] text-gray-500">{t.date}</p></div>
                  </div>
                  <span className="text-xs font-mono text-white">₹{formatMoney(t.amount)}</span>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-gray-300 font-bold">{t.desc || (t.type === 'GAVE' ? 'Gave' : 'Got')}</p>
                    <p className={`text-[9px] font-bold ${t.type === 'GAVE' ? 'text-neonBlue' : 'text-red-400'}`}>{t.type} • {t.date}</p>
                  </div>
                  <span className="text-xs font-mono text-white">₹{formatMoney(t.amount)}</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
