const LEADS_KEY = 'leads';
const DEALS_KEY = 'deals';

function readArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function writeArray(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

export function getLeads() {
  return readArray(LEADS_KEY);
}

export function addLead(lead) {
  const leads = getLeads();
  const newLead = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...lead };
  leads.push(newLead);
  writeArray(LEADS_KEY, leads);
  return newLead;
}

export function getDeals() {
  return readArray(DEALS_KEY);
}

export function addDeal(deal) {
  const deals = getDeals();
  const newDeal = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...deal };
  deals.push(newDeal);
  writeArray(DEALS_KEY, deals);
  return newDeal;
}

