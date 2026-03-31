import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { useToast } from '../components/ToastProvider';

const SOIL_TYPES = [
  {
    value: 'clay',
    label: 'Clay',
    image_url: 'https://img.freepik.com/free-photo/close-up-mixture-clay-powder_23-2148761860.jpg?semt=ais_hybrid&w=740&q=80',
  },
  {
    value: 'sandy',
    label: 'Sandy',
    image_url: 'https://ecogardener.com/cdn/shop/articles/Improving_Sandy_Soil_Choosing_a_Soil_Amendment-min.jpg?v=1767593931',
  },
  {
    value: 'loam',
    label: 'Loam',
    image_url: 'https://www.thespruce.com/thmb/8GwdNANondhXtvtTqZUsti_qBbA=/3008x0/filters:no_upscale():max_bytes(150000):strip_icc()/what-is-loam-1401908-01-a8ed5af19c7243fcb5d108e893a43bbe.jpg',
  },
  {
    value: 'peat',
    label: 'Peat',
    image_url: 'https://peatlands.org/assets/uploads/2019/06/peatsw-1280x720.jpg',
  },
];

const EMPTY_FORM = {
  crop_id: '',
  field_name: '',
  soil_type: 'clay',
  ph_value: '',
  moisture_level: '',
  nitrogen_level: '',
  phosphorus_level: '',
  potassium_level: '',
  recorded_date: '',
};

export default function Soil() {
  const toast = useToast();
  const [soil, setSoil] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [crops, setCrops] = useState([]);

  const onCropChange = (cropId) => {
    const selected = crops.find((c) => String(c.id) === String(cropId));
    const nextFieldName = selected?.field_location || selected?.crop_name || '';
    setForm((prev) => ({
      ...prev,
      crop_id: cropId,
      field_name: cropId ? nextFieldName : prev.field_name,
    }));
  };

  const loadSoil = async () => {
    try {
      const data = await apiRequest('/api/soil');
      setSoil(data);
    } catch (e) {
      toast('Cannot load soil data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCrops = async () => {
    try {
      const data = await apiRequest('/api/crops');
      setCrops(data);
    } catch (e) {
      setCrops([]);
    }
  };

  useEffect(() => {
    loadSoil();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
    loadCrops();
  };

  const openEditModal = async (id) => {
    try {
      const s = await apiRequest(`/api/soil/${id}`);
      setEditingId(id);
      setForm({
        crop_id: s.crop_id || '',
        field_name: s.field_name || '',
        soil_type: s.soil_type || 'clay',
        ph_value: s.ph_value ?? '',
        moisture_level: s.moisture_level ?? '',
        nitrogen_level: s.nitrogen_level ?? '',
        phosphorus_level: s.phosphorus_level ?? '',
        potassium_level: s.potassium_level ?? '',
        recorded_date: s.recorded_date || '',
      });
      setModalOpen(true);
      loadCrops();
    } catch (e) {
      toast('Failed to load soil for editing', 'error');
    }
  };

  const openView = async (id) => {
    try {
      const s = await apiRequest(`/api/soil/${id}`);
      setViewItem(s);
      setViewOpen(true);
    } catch (e) {
      toast('Failed to load soil details', 'error');
    }
  };

  const saveSoil = async () => {
    if (!form.field_name) {
      toast('Field name required', 'error');
      return;
    }
    const body = {
      crop_id: form.crop_id || null,
      field_name: form.field_name,
      soil_type: form.soil_type,
      ph_value: form.ph_value === '' ? null : parseFloat(form.ph_value),
      moisture_level: form.moisture_level === '' ? null : parseFloat(form.moisture_level),
      nitrogen_level: form.nitrogen_level === '' ? null : parseFloat(form.nitrogen_level),
      phosphorus_level: form.phosphorus_level === '' ? null : parseFloat(form.phosphorus_level),
      potassium_level: form.potassium_level === '' ? null : parseFloat(form.potassium_level),
      recorded_date: form.recorded_date || null,
    };
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/soil/${editingId}` : '/api/soil';
      await apiRequest(url, method, body);
      toast(editingId ? 'Soil record updated!' : 'Soil record added!');
      setModalOpen(false);
      setEditingId(null);
      loadSoil();
    } catch (e) {
      toast('Failed to save', 'error');
    }
  };

  const deleteSoil = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await apiRequest(`/api/soil/${id}`, 'DELETE');
      toast('Deleted');
      loadSoil();
    } catch (e) {
      toast('Delete failed', 'error');
    }
  };

  return (
    <div className="page active">
      <div className="topbar">
        <div><div className="page-title">Soil Monitoring</div><div className="page-sub">Member 3 — POST /api/soil</div></div>
        <div className="topbar-actions"><button className="btn btn-primary" onClick={openCreateModal}>+ Add Record</button></div>
      </div>
      <div className="content">
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Soil Records</div></div>
          <div className="panel-body" style={{ padding: 0 }}>
            {loading ? (<div className="loading">Loading soil data...</div>) : null}
            {!loading && !soil.length ? (
              <div className="empty-state"><div className="empty-icon">🌍</div><div className="empty-text">No soil records yet.</div></div>
            ) : null}
            {soil.length ? (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>ID</th><th>Field</th><th>Type</th><th>pH</th><th>Moisture%</th><th>N</th><th>P</th><th>K</th><th>Date</th><th>Actions</th></tr></thead>
                  <tbody>
                    {soil.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontFamily: "'DM Mono',monospace", color: 'var(--text3)' }}>#{s.id}</td>
                        <td className="td-main">{s.field_name}</td>
                        <td>{s.soil_type || '—'}</td>
                        <td><span className={`badge ${s.ph_value < 5.5 ? 'badge-red' : s.ph_value > 7.5 ? 'badge-amber' : 'badge-green'}`}>{s.ph_value ?? '—'}</span></td>
                        <td>{s.moisture_level ?? '—'}</td>
                        <td>{s.nitrogen_level ?? '—'}</td>
                        <td>{s.phosphorus_level ?? '—'}</td>
                        <td>{s.potassium_level ?? '—'}</td>
                        <td style={{ fontFamily: "'DM Mono',monospace" }}>{s.recorded_date || '—'}</td>
                        <td style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-info btn-sm" onClick={() => openView(s.id)}>View</button>
                          <button className="btn btn-warning btn-sm" onClick={() => openEditModal(s.id)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteSoil(s.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div className="modal-overlay open" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setModalOpen(false); }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editingId ? 'Edit Soil Record' : 'Add Soil Record'}</div>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Link to Crop (Optional)</label>
                  <select className="form-select" value={form.crop_id} onChange={(e) => onCropChange(e.target.value)}>
                    <option value="">-- No linked crop --</option>
                    {crops.map((c) => (
                      <option key={c.id} value={c.id}>{c.crop_name} ({c.field_location || 'N/A'})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Field Name *</label><input className="form-input" value={form.field_name} onChange={(e) => setForm({ ...form, field_name: e.target.value })} placeholder="e.g. North Field A" /></div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Soil Type</label>
                  <div className="crop-library-grid" style={{ maxHeight: 'none' }}>
                    {SOIL_TYPES.map((t) => {
                      const isSelected = form.soil_type === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          className={`crop-tile ${isSelected ? 'selected' : ''}`}
                          onClick={() => setForm((prev) => ({ ...prev, soil_type: t.value }))}
                          aria-pressed={isSelected}
                        >
                          <img src={t.image_url} alt={t.label} loading="lazy" />
                          <div className="crop-tile-title">{t.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="form-group"><label className="form-label">pH Value</label><input className="form-input" type="number" step="0.1" value={form.ph_value} onChange={(e) => setForm({ ...form, ph_value: e.target.value })} placeholder="e.g. 6.5 (ideal: 6-7)" /></div>
                <div className="form-group"><label className="form-label">Moisture Level (%)</label><input className="form-input" type="number" value={form.moisture_level} onChange={(e) => setForm({ ...form, moisture_level: e.target.value })} placeholder="e.g. 55" /></div>
                <div className="form-group"><label className="form-label">Nitrogen (kg/ha)</label><input className="form-input" type="number" value={form.nitrogen_level} onChange={(e) => setForm({ ...form, nitrogen_level: e.target.value })} placeholder="e.g. 40" /></div>
                <div className="form-group"><label className="form-label">Phosphorus (kg/ha)</label><input className="form-input" type="number" value={form.phosphorus_level} onChange={(e) => setForm({ ...form, phosphorus_level: e.target.value })} placeholder="e.g. 35" /></div>
                <div className="form-group"><label className="form-label">Potassium (kg/ha)</label><input className="form-input" type="number" value={form.potassium_level} onChange={(e) => setForm({ ...form, potassium_level: e.target.value })} placeholder="e.g. 45" /></div>
                <div className="form-group"><label className="form-label">Recorded Date</label><input className="form-input" type="date" value={form.recorded_date} onChange={(e) => setForm({ ...form, recorded_date: e.target.value })} /></div>
                <div className="form-actions">
                  <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={saveSoil}>{editingId ? 'Update Record' : 'Save Record'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {viewOpen && viewItem ? (
        <div className="modal-overlay open" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setViewOpen(false); }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Soil Details</div>
              <button className="modal-close" onClick={() => setViewOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: 'var(--bg3)', padding: '16px', borderRadius: 'var(--radius2)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '12px' }}>Field Information</div>
                  <div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Field Name</div><div style={{ fontSize: '16px', fontWeight: 600 }}>{viewItem.field_name || '—'}</div></div>
                  <div style={{ marginTop: '8px' }}><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Soil Type</div><div style={{ fontSize: '14px' }}>{viewItem.soil_type || '—'}</div></div>
                  <div style={{ marginTop: '8px' }}><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Recorded Date</div><div style={{ fontSize: '14px', fontFamily: "'DM Mono'" }}>{viewItem.recorded_date || '—'}</div></div>
                </div>
                <div style={{ background: 'var(--bg3)', padding: '16px', borderRadius: 'var(--radius2)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '12px' }}>Soil Properties</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>pH</div><div style={{ fontSize: '18px', fontWeight: 600 }}>{viewItem.ph_value ?? '—'}</div></div>
                    <div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Moisture</div><div style={{ fontSize: '18px', fontWeight: 600 }}>{viewItem.moisture_level !== null ? `${viewItem.moisture_level}%` : '—'}</div></div>
                    <div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Nitrogen</div><div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--green)' }}>{viewItem.nitrogen_level ?? '—'}</div></div>
                    <div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Phosphorus</div><div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--green)' }}>{viewItem.phosphorus_level ?? '—'}</div></div>
                    <div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Potassium</div><div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--green)' }}>{viewItem.potassium_level ?? '—'}</div></div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => { setViewOpen(false); openEditModal(viewItem.id); }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => { setViewOpen(false); deleteSoil(viewItem.id); }}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
