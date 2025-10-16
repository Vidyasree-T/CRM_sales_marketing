import React from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import { getLeads, getDeals } from './store.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function Navbar() {
  return (
    <header className='nav'>
      <div className='brand'>CRM</div>
      <nav>
        <NavLink to='/' end>Dashboard</NavLink>
        <NavLink to='/leads'>Leads</NavLink>
        <NavLink to='/leads/new'>+ Lead</NavLink>
        <NavLink to='/contacts'>Contacts</NavLink>
        <NavLink to='/deals'>Deals</NavLink>
        <NavLink to='/deals/new'>+ Deal</NavLink>
        <NavLink to='/reports'>Reports</NavLink>
        <NavLink to='/settings'>Settings</NavLink>
      </nav>
    </header>
  );
}

function Page({ title }) {
  return (
    <div className='page'>
      <h1>{title}</h1>
      <p>Basic working view for {title}.</p>
    </div>
  );
}

export default function App() {
  return (
    <div className='app'>
      <Navbar />
      <main className='content'>
        <Routes>
          <Route path='/' element={<Dashboard />} />
          <Route path='/leads' element={<LeadsList />} />
          <Route path='/leads/new' element={<LeadsForm />} />
          <Route path='/contacts' element={<ContactsPage />} />
          <Route path='/deals' element={<DealsList />} />
          <Route path='/deals/new' element={<DealsForm />} />
          <Route path='/reports' element={<ReportsPage />} />
          <Route path='/reports/filter' element={<ReportsFilter />} />
          <Route path='/settings' element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

function Dashboard() {
  const [manualMode, setManualMode] = React.useState(false);
  const [manualInput, setManualInput] = React.useState('12, 18, 10, 22, 17, 25, 19');
  const [leads, setLeads] = React.useState([]);
  const [deals, setDeals] = React.useState([]);

  React.useEffect(() => {
    setLeads(getLeads());
    setDeals(getDeals());
  }, []);

  const valuesFromManual = React.useMemo(() => {
    return manualInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n));
  }, [manualInput]);

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  const monthlyDeals = React.useMemo(() => {
    const map = new Map();
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      map.set(d.toISOString().slice(0, 7), 0);
    }
    deals.forEach((d) => {
      const date = d.closeDate ? new Date(d.closeDate) : new Date(d.createdAt);
      const key = startOfMonth(date).toISOString().slice(0, 7);
      if (map.has(key)) {
        const val = Number(d.value) || 0;
        map.set(key, map.get(key) + val);
      }
    });
    const labels = Array.from(map.keys());
    const values = Array.from(map.values());
    return { labels, values };
  }, [deals]);

  const chartValues = manualMode ? valuesFromManual : monthlyDeals.values;
  const chartLabels = manualMode ? valuesFromManual.map((_, i) => `P${i + 1}`) : monthlyDeals.labels;

  const data = React.useMemo(() => ({
    labels: chartLabels,
    datasets: [
      {
        label: manualMode ? 'Manual' : 'Deals (Monthly Value)',
        data: chartValues,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.2)',
        pointRadius: 3,
        tension: 0.25,
      },
    ],
  }), [chartLabels, chartValues, manualMode]);

  const options = {
    responsive: true,
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
    },
    plugins: { legend: { labels: { color: '#cbd5e1' } }, tooltip: { enabled: true } },
  };

  const totalLeads = leads.length;
  const monthKeyNow = new Date().toISOString().slice(0, 7);
  const newLeadsThisMonth = leads.filter((l) => (l.createdAt || '').slice(0, 7) === monthKeyNow).length;
  const totalDeals = deals.length;
  const pipelineValue = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const wonValue = deals.filter((d) => d.stage === 'Closed-Won').reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const currency = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

  return (
    <div className='page'>
      <h1>Dashboard</h1>
      <div className='kpis'>
        <div className='card'><div className='small'>Total Leads</div><div style={{ color: '#e2e8f0', fontSize: 22 }}>{totalLeads}</div></div>
        <div className='card'><div className='small'>New Leads (This Month)</div><div style={{ color: '#e2e8f0', fontSize: 22 }}>{newLeadsThisMonth}</div></div>
        <div className='card'><div className='small'>Total Deals</div><div style={{ color: '#e2e8f0', fontSize: 22 }}>{totalDeals}</div></div>
        <div className='card'><div className='small'>Pipeline Value</div><div style={{ color: '#e2e8f0', fontSize: 22 }}>{currency(pipelineValue)}</div></div>
        <div className='card'><div className='small'>Won Value</div><div style={{ color: '#e2e8f0', fontSize: 22 }}>{currency(wonValue)}</div></div>
      </div>
      <div className='card' style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type='checkbox' checked={manualMode} onChange={(e) => setManualMode(e.target.checked)} />
          Use manual chart data
        </label>
        <div className='small'>When off, the chart shows monthly sum of Deal values.</div>
      </div>
      {manualMode && (
        <div className='card'>
          <label className='small' style={{ display: 'block', marginBottom: 6 }}>Manual data (comma-separated numbers, e.g., 10, 15, 8)</label>
          <textarea className='input' rows={3} value={manualInput} onChange={(e) => setManualInput(e.target.value)} placeholder='e.g. 10, 15, 8, 20, 13' />
        </div>
      )}
      <div className='card'>
        {chartValues && chartValues.length > 0 ? (
          <Line data={data} options={options} />
        ) : (
          <div className='empty'>No data to chart yet. Add some Deals or enable manual data.</div>
        )}
      </div>
    </div>
  );
}

function LeadsList() {
  const [leads, setLeads] = React.useState(() => ([]));
  React.useEffect(() => {
    import('./store.js').then(({ getLeads }) => setLeads(getLeads()));
  }, []);
  return (
    <div className='page'>
      <h1>Leads</h1>
      {leads.length === 0 ? (
        <div className='empty'>No leads yet. Use "+ Lead" to add one.</div>
      ) : (
        <div className='card'>
          {leads.map((l) => (
            <div key={l.id} style={{ padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
              <div style={{ color: '#e2e8f0' }}>{l.fullName} — {l.companyName || 'N/A'}</div>
              <div className='small'>{l.email} · {l.phone} · {l.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeadsForm() {
  const [form, setForm] = React.useState({
    fullName: '', email: '', phone: '', companyName: '', leadSource: '', status: 'New', notes: ''
  });
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = async (e) => {
    e.preventDefault();
    const { addLead } = await import('./store.js');
    addLead(form);
    setForm({ fullName: '', email: '', phone: '', companyName: '', leadSource: '', status: 'New', notes: '' });
    alert('Lead added');
  };
  return (
    <div className='page'>
      <h1>New Lead</h1>
      <form className='card' onSubmit={onSubmit}>
        <div className='grid'>
          <label>Full Name (required)
            <input name='fullName' value={form.fullName} onChange={onChange} required placeholder='e.g. John Doe' aria-label='Full Name' />
          </label>
          <label>Email Address
            <input name='email' type='email' value={form.email} onChange={onChange} placeholder='e.g. john@example.com' aria-label='Email Address' />
          </label>
          <label>Phone Number
            <input name='phone' value={form.phone} onChange={onChange} placeholder='e.g. +1 415 555 0199' aria-label='Phone Number' />
          </label>
          <label>Company Name
            <input name='companyName' value={form.companyName} onChange={onChange} placeholder='e.g. Acme Inc' aria-label='Company Name' />
          </label>
          <label>Lead Source
            <input name='leadSource' value={form.leadSource} onChange={onChange} placeholder='Website, Referral, Social Media, Campaign, Other' aria-label='Lead Source' />
          </label>
          <label>Status (required)
            <select name='status' value={form.status} onChange={onChange} aria-label='Status'>
            <option>New</option><option>Contacted</option><option>Qualified</option><option>Converted</option>
            </select>
          </label>
          <label className='col-2'>Notes
            <textarea name='notes' rows={3} value={form.notes} onChange={onChange} placeholder='Context, next steps, objections, etc.' aria-label='Notes' />
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type='submit' className='btn'>Save Lead</button>
        </div>
      </form>
    </div>
  );
}

function DealsList() {
  const [deals, setDeals] = React.useState(() => ([]));
  React.useEffect(() => {
    import('./store.js').then(({ getDeals }) => setDeals(getDeals()));
  }, []);
  return (
    <div className='page'>
      <h1>Deals</h1>
      {deals.length === 0 ? (
        <div className='empty'>No deals yet. Use "+ Deal" to add one.</div>
      ) : (
        <div className='card'>
          {deals.map((d) => (
            <div key={d.id} style={{ padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
              <div style={{ color: '#e2e8f0' }}>{d.name} — {d.stage} — ${d.value}</div>
              <div className='small'>Owner: {d.owner || 'N/A'} · Close: {d.closeDate || 'N/A'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DealsForm() {
  const [form, setForm] = React.useState({
    name: '', linked: '', value: '', stage: 'Prospecting', closeDate: '', owner: ''
  });
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = async (e) => {
    e.preventDefault();
    const { addDeal } = await import('./store.js');
    const valueNum = Number(form.value);
    addDeal({ ...form, value: Number.isFinite(valueNum) ? valueNum : 0 });
    setForm({ name: '', linked: '', value: '', stage: 'Prospecting', closeDate: '', owner: '' });
    alert('Deal added');
  };
  return (
    <div className='page'>
      <h1>New Deal</h1>
      <form className='card' onSubmit={onSubmit}>
        <div className='grid'>
          <label>Opportunity Name (required)
            <input name='name' value={form.name} onChange={onChange} required placeholder='e.g. Acme – CRM Subscription' aria-label='Opportunity Name' />
          </label>
          <label>Linked Customer / Lead
            <input name='linked' value={form.linked} onChange={onChange} placeholder='e.g. John Doe (Acme)' aria-label='Linked Customer or Lead' />
          </label>
          <label>Estimated Deal Value
            <input name='value' type='number' step='0.01' value={form.value} onChange={onChange} placeholder='Numbers only, e.g. 15000' aria-label='Estimated Deal Value' />
          </label>
          <label>Deal Stage (required)
            <select name='stage' value={form.stage} onChange={onChange} aria-label='Deal Stage'>
            <option>Prospecting</option><option>Negotiation</option><option>Closed-Won</option><option>Closed-Lost</option>
            </select>
          </label>
          <label>Expected Closing Date
            <input name='closeDate' type='date' value={form.closeDate} onChange={onChange} aria-label='Expected Closing Date' />
          </label>
          <label>Sales Owner
            <input name='owner' value={form.owner} onChange={onChange} placeholder='e.g. Sarah Nguyen' aria-label='Sales Owner' />
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type='submit' className='btn'>Save Deal</button>
        </div>
      </form>
    </div>
  );
}

function ReportsFilter() {
  const [form, setForm] = React.useState({ range: 'last30', metric: 'Sales', salesperson: '', region: '', campaign: '' });
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  return (
    <div className='page'>
      <h1>Reports</h1>
      <form className='card'>
        <div className='grid'>
          <label>Date Range<select name='range' value={form.range} onChange={onChange}>
            <option value='last7'>Last 7 days</option>
            <option value='last30'>Last 30 days</option>
            <option value='thisQ'>This quarter</option>
            <option value='thisY'>This year</option>
          </select></label>
          <label>Metric<select name='metric' value={form.metric} onChange={onChange}>
            <option>Sales</option><option>Leads</option><option>Conversions</option><option>ROI</option>
          </select></label>
          <label>Salesperson<input name='salesperson' value={form.salesperson} onChange={onChange} /></label>
          <label>Region<input name='region' value={form.region} onChange={onChange} /></label>
          <label className='col-2'>Campaign Type<input name='campaign' value={form.campaign} onChange={onChange} /></label>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type='button' className='btn' onClick={() => alert('Filters applied')}>Apply Filters</button>
        </div>
      </form>
    </div>
  );
}

function ContactsPage() {
  return (
    <div className='page'>
      <h1>Contacts</h1>
      <div className='card'>
        <p style={{ marginTop: 0 }}>Track people related to your Accounts/Leads.</p>
        <div className='grid'>
          <label>Name<input placeholder='e.g. Priya Sharma' /></label>
          <label>Email<input type='email' placeholder='e.g. priya@example.com' /></label>
          <label>Phone<input placeholder='e.g. +91 98765 43210' /></label>
          <label>Company<input placeholder='e.g. Acme Pvt Ltd' /></label>
          <label className='col-2'>Position/Title<input placeholder='e.g. Marketing Manager' /></label>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type='button' className='btn' onClick={() => alert('Contact form is a demo placeholder for now')}>Save Contact</button>
        </div>
      </div>
    </div>
  );
}

function ReportsPage() {
  return (
    <div className='page'>
      <h1>Reports</h1>
      <div className='card'>
        <p style={{ marginTop: 0 }}>Analyze your performance with filters for date range, metrics, and more.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a className='btn' href='/reports/filter'>Open Filters</a>
          <button className='btn' onClick={() => alert('Export coming soon')}>Export CSV</button>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  const [form, setForm] = React.useState({ theme: 'dark', notifications: true, timezone: 'Local' });
  const onChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };
  return (
    <div className='page'>
      <h1>Settings</h1>
      <form className='card' onSubmit={(e) => { e.preventDefault(); alert('Settings saved'); }}>
        <div className='grid'>
          <label>Theme<select name='theme' value={form.theme} onChange={onChange}>
            <option value='dark'>Dark</option>
            <option value='light'>Light</option>
          </select></label>
          <label>Timezone<select name='timezone' value={form.timezone} onChange={onChange}>
            <option>Local</option>
            <option>UTC</option>
          </select></label>
          <label className='col-2' style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type='checkbox' name='notifications' checked={form.notifications} onChange={onChange} />
            Enable email notifications
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <button className='btn' type='submit'>Save</button>
        </div>
      </form>
    </div>
  );
}
