import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest, getImageUrl } from '../api';
import { useToast } from '../components/ToastProvider';

const EMPTY_FORM = {
  crop_id: '',
  advices: [{ advice_type: 'general', start_date: '', end_date: '', advice_text: '' }],
  recommendation_type: 'expert_task',
};

const ADVICE_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'pest', label: 'Pest Control' },
  { value: 'water_controling', label: 'Water Controlling' },
];

function createEmptyAdvice() {
  return { advice_type: 'general', start_date: '', end_date: '', water_amount: '', water_unit: 'L', advice_text: '' };
}

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

const WEATHER_CONDITIONS = [
  {
    value: 'sunny',
    label: 'Sunny',
    image_url: 'https://t4.ftcdn.net/jpg/03/05/09/59/360_F_305095987_GdzExAR8x0LCCNBdanfBIw8HkJiJZzDg.jpg',
  },
  {
    value: 'partly cloudy',
    label: 'Partly Cloudy',
    image_url: 'https://media.istockphoto.com/id/503665822/photo/sky-cloud.jpg?s=612x612&w=0&k=20&c=WQGdlo2fEvHg1m7EbKKKkbnTQvbf5Og81I9P5SprjaM=',
  },
  {
    value: 'rainy',
    label: 'Rainy',
    image_url: 'https://i.pinimg.com/736x/e7/76/e8/e776e8191b9ab549a151433bfaf5bf64.jpg',
  },
  {
    value: 'stormy',
    label: 'Stormy',
    image_url: 'https://www.timeforkids.com/wp-content/uploads/2019/03/THUNDERWEATHER.jpg',
  },
];

function normalizeForecastCondition(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return '';
  if (s.includes('thunder') || s.includes('storm')) return 'stormy';
  if (s.includes('rain') || s.includes('drizzle') || s.includes('shower')) return 'rainy';
  if (s.includes('cloud') || s.includes('overcast') || s.includes('fog')) return 'partly cloudy';
  if (s.includes('clear')) return 'sunny';
  if (['sunny', 'partly cloudy', 'rainy', 'stormy'].includes(s)) return s;
  return '';
}

function renderRecoCard(r, onView, onEdit, onDelete) {
  const advices = Array.isArray(r.advices) ? r.advices : [];
  const normalized = advices
    .map((a) => {
      if (!a) return null;
      if (typeof a === 'string') {
        const txt = String(a).trim();
        return txt ? { advice_text: txt } : null;
      }
      const txt = String(a.advice_text || '').trim();
      if (!txt) return null;
      return {
        advice_text: txt,
        advice_type: a.advice_type || '',
        start_date: a.start_date || '',
        end_date: a.end_date || '',
        water_amount: a.water_amount ?? null,
        water_unit: a.water_unit || '',
      };
    })
    .filter(Boolean);

  const dateRange = (r.target_date || r.target_date_end) ? `${r.target_date || ''} to ${r.target_date_end || ''}` : '';
  return (
    <div className="reco-card" key={r.id}>
      <div className="reco-header">
        <div>
          <div className="reco-title">{r.recommendation_type === 'expert_task' ? '📋 Supervisor Task' : '🤖 Auto Advice'} · Crop #{r.crop_id}</div>
          <div className="reco-meta">#{r.id}{dateRange ? ` · ${dateRange}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-info btn-sm" onClick={() => onView(r.id)}>View</button>
          <button className="btn btn-warning btn-sm" onClick={() => onEdit(r.id)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(r.id)}>Delete</button>
        </div>
      </div>
      <div className="reco-sections">
        {normalized.length ? (
          <div className="reco-section">
            <div className="reco-section-label notes">Advice</div>
            <div className="reco-section-text" style={{ whiteSpace: 'pre-line' }}>
              {normalized
                .map((a, idx) => {
                  const type = a.advice_type ? `[${a.advice_type}] ` : '';
                  const dates = (a.start_date || a.end_date) ? `(${a.start_date || '—'} → ${a.end_date || '—'}) ` : '';
                  const water = (a.water_amount !== null && a.water_amount !== undefined && a.water_amount !== '')
                    ? `{water: ${a.water_amount}${a.water_unit ? ` ${a.water_unit}` : ''}} `
                    : '';
                  return `${idx + 1}. ${type}${dates}${water}${a.advice_text}`;
                })
                .join('\n')}
            </div>
          </div>
        ) : null}
        {r.fertilizer_advice ? (
          <div className="reco-section"><div className="reco-section-label fertilizer">Fertilizer Advice</div><div className="reco-section-text">{r.fertilizer_advice}</div></div>
        ) : null}
        {r.irrigation_advice ? (
          <div className="reco-section"><div className="reco-section-label irrigation">Irrigation Advice</div><div className="reco-section-text">{r.irrigation_advice}</div></div>
        ) : null}
        {r.pest_alert ? (
          <div className="reco-section"><div className="reco-section-label pest">Pest Alerts</div><div className="reco-section-text">{r.pest_alert}</div></div>
        ) : null}
        {r.general_notes ? (
          <div className="reco-section"><div className="reco-section-label notes">General Notes</div><div className="reco-section-text">{r.general_notes}</div></div>
        ) : null}
      </div>
    </div>
  );
}

export default function Recommendations() {
  const toast = useToast();
  const [recos, setRecos] = useState([]);
  const [crops, setCrops] = useState([]);
  const [weather, setWeather] = useState([]);
  const [soil, setSoil] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [resultHtml, setResultHtml] = useState('');

  const loadRecommendations = async () => {
    try {
      const [cropData, recoData] = await Promise.all([
        apiRequest('/api/crops'),
        apiRequest('/api/recommendations'),
      ]);
      setCrops(cropData);
      setRecos(recoData);
    } catch (e) {
      setRecos([]);
    }
  };

  const loadSummarySources = async () => {
    try {
      const [w, s] = await Promise.all([
        apiRequest('/api/weather'),
        apiRequest('/api/soil'),
      ]);
      setWeather(Array.isArray(w) ? w : []);
      setSoil(Array.isArray(s) ? s : []);
    } catch {
      setWeather([]);
      setSoil([]);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setResultHtml('');
    setModalOpen(true);
    loadSummarySources();
  };

  const openEditModal = async (id) => {
    try {
      const r = await apiRequest(`/api/recommendations/${id}`);
      const rawAdvices = Array.isArray(r.advices) ? r.advices : [];
      const normalizedAdvices = rawAdvices
        .map((a) => {
          if (!a) return null;
          if (typeof a === 'string') {
            const txt = String(a).trim();
            return txt ? { advice_type: 'general', start_date: r.target_date || '', end_date: r.target_date_end || '', advice_text: txt } : null;
          }
          const txt = String(a.advice_text || '').trim();
          return {
            advice_type: a.advice_type || 'general',
            start_date: a.start_date || '',
            end_date: a.end_date || '',
            water_amount: a.water_amount ?? '',
            water_unit: a.water_unit || 'L',
            advice_text: txt,
          };
        })
        .filter(Boolean);
      setEditingId(id);
      setForm({
        crop_id: r.crop_id || '',
        advices: normalizedAdvices.length ? normalizedAdvices : [createEmptyAdvice()],
        recommendation_type: r.recommendation_type || 'expert_task',
      });
      setModalOpen(true);
      loadSummarySources();
    } catch (e) {
      toast('Failed to load recommendation for editing', 'error');
    }
  };

  const selectedCrop = useMemo(() => crops.find((c) => String(c.id) === String(form.crop_id)) || null, [crops, form.crop_id]);

  const latestWeatherForCrop = useMemo(() => {
    if (!form.crop_id) return null;
    const list = weather.filter((w) => String(w.crop_id) === String(form.crop_id));
    if (!list.length) return null;
    const sorted = [...list].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    return sorted[0] || null;
  }, [weather, form.crop_id]);

  const latestSoilForCrop = useMemo(() => {
    if (!form.crop_id) return null;
    const list = soil.filter((s) => String(s.crop_id) === String(form.crop_id));
    if (!list.length) return null;
    const sorted = [...list].sort((a, b) => String(b.recorded_date || '').localeCompare(String(a.recorded_date || '')));
    return sorted[0] || null;
  }, [soil, form.crop_id]);

  const openView = async (id) => {
    try {
      const r = await apiRequest(`/api/recommendations/${id}`);
      setViewItem(r);
      setViewOpen(true);
    } catch (e) {
      toast('Failed to load recommendation', 'error');
    }
  };

  const saveReco = async () => {
    if (!form.crop_id) {
      toast('Please select a target crop', 'error');
      return;
    }

    const cleanedAdvices = (Array.isArray(form.advices) ? form.advices : [])
      .map((a) => {
        if (!a) return null;
        const advice_text = String(a.advice_text || '').trim();
        if (!advice_text) return null;
        const advice_type = a.advice_type || 'general';

        const water_amount = (advice_type === 'water_controling' && a.water_amount !== '' && a.water_amount !== null && a.water_amount !== undefined)
          ? parseFloat(a.water_amount)
          : null;
        const water_unit = advice_type === 'water_controling' ? (a.water_unit || 'L') : null;

        const safeWaterAmount = (water_amount !== null && Number.isFinite(water_amount)) ? water_amount : null;
        return {
          advice_type,
          start_date: a.start_date || null,
          end_date: a.end_date || null,
          water_amount: safeWaterAmount,
          water_unit,
          advice_text,
        };
      })
      .filter(Boolean);

    const dates = cleanedAdvices
      .flatMap((a) => [a.start_date, a.end_date])
      .filter((d) => typeof d === 'string' && d)
      .sort((a, b) => String(a).localeCompare(String(b)));

    const target_date = dates.length ? dates[0] : null;
    const target_date_end = dates.length ? dates[dates.length - 1] : null;

    setResultHtml('<div class="loading">Saving task...</div>');
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/recommendations/${editingId}` : '/api/recommendations';
      const payload = {
        crop_id: form.crop_id,
        target_date,
        target_date_end,
        advices: cleanedAdvices,
        recommendation_type: form.recommendation_type || 'expert_task',
      };
      await apiRequest(url, method, payload);
      toast(editingId ? 'Task updated!' : 'Task assigned!');
      setModalOpen(false);
      setEditingId(null);
      setResultHtml('');
      loadRecommendations();
    } catch (e) {
      setResultHtml(`<div class="alert alert-error" style="margin-top:16px">Failed: ${e.message}</div>`);
    }
  };

  const deleteReco = async (id) => {
    if (!window.confirm('Delete this recommendation?')) return;
    try {
      await apiRequest(`/api/recommendations/${id}`, 'DELETE');
      toast('Deleted');
      loadRecommendations();
    } catch (e) {
      toast('Delete failed', 'error');
    }
  };

  return (
    <div className="page active">
      <div className="topbar">
        <div><div className="page-title">Recommendations</div><div className="page-sub">Member 4 — Smart farming advice engine</div></div>
        <div className="topbar-actions"><button className="btn btn-primary" onClick={openCreateModal}>+ Add Recommendation</button></div>
      </div>
      <div className="content">
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Past Recommendation Records</div></div>
          <div className="panel-body">
            {recos.length ? recos.map((r) => renderRecoCard(r, openView, openEditModal, deleteReco)) : (
              <div className="empty-state"><div className="empty-text">No past recommendation records yet.</div></div>
            )}
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div className="modal-overlay open" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setModalOpen(false); }}>
          <div className="modal" style={{ width: '760px', maxWidth: '95vw' }}>
            <div className="modal-header">
              <div className="modal-title">{editingId ? 'Edit Task/Recommendation' : 'Create Task Assignment'}</div>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Target Crop</label>
                  <select className="form-select" value={form.crop_id} onChange={(e) => setForm((prev) => ({ ...prev, crop_id: e.target.value }))}>
                    <option value="">-- Select Crop --</option>
                    {crops.map((c) => (
                      <option key={c.id} value={c.id}>#{c.id} — {c.crop_name} ({c.farmer_name || '?'})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1', color: 'var(--text3)', fontSize: '12px', alignSelf: 'end' }}>
                  Task start/end dates are set per advice.
                </div>

                {form.crop_id ? (
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Summary</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--radius2)', overflow: 'hidden' }}>
                        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border2)', fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Crop</div>
                        <div style={{ padding: '12px' }}>
                          {selectedCrop ? (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              {getImageUrl(selectedCrop.crop_image_path || (selectedCrop.crop_image_name ? `/crop_images/${selectedCrop.crop_image_name}` : '')) ? (
                                <img
                                  src={getImageUrl(selectedCrop.crop_image_path || (selectedCrop.crop_image_name ? `/crop_images/${selectedCrop.crop_image_name}` : ''))}
                                  alt={selectedCrop.crop_name}
                                  style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border2)' }}
                                />
                              ) : null}
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>{selectedCrop.crop_name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{selectedCrop.crop_type}</div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ color: 'var(--text3)', fontSize: '12px' }}>No crop selected.</div>
                          )}
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--radius2)', overflow: 'hidden' }}>
                        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border2)', fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Weather</div>
                        <div style={{ padding: '12px' }}>
                          {latestWeatherForCrop ? (() => {
                            const key = normalizeForecastCondition(latestWeatherForCrop.forecast_condition);
                            const tile = WEATHER_CONDITIONS.find((x) => x.value === key) || null;
                            return (
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {tile ? (
                                  <img src={tile.image_url} alt={tile.label} style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border2)' }} />
                                ) : null}
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>{tile?.label || (latestWeatherForCrop.forecast_condition || '—')}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{latestWeatherForCrop.date || ''}</div>
                                </div>
                              </div>
                            );
                          })() : (
                            <div style={{ color: 'var(--text3)', fontSize: '12px' }}>No linked weather record.</div>
                          )}
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--radius2)', overflow: 'hidden' }}>
                        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border2)', fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Soil</div>
                        <div style={{ padding: '12px' }}>
                          {latestSoilForCrop ? (() => {
                            const key = String(latestSoilForCrop.soil_type || '').toLowerCase();
                            const tile = SOIL_TYPES.find((x) => x.value === key) || null;
                            return (
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {tile ? (
                                  <img src={tile.image_url} alt={tile.label} style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border2)' }} />
                                ) : null}
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>{tile?.label || (latestSoilForCrop.soil_type || '—')}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{latestSoilForCrop.recorded_date || ''}</div>
                                </div>
                              </div>
                            );
                          })() : (
                            <div style={{ color: 'var(--text3)', fontSize: '12px' }}>No linked soil record.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="form-label">Advice</label>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setForm((prev) => ({ ...prev, advices: [...(prev.advices || []), createEmptyAdvice()] }))}
                    >
                      + Add Advice
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                    {(form.advices || []).map((a, idx) => (
                      <div key={idx} style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--radius2)', padding: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Type</label>
                            <select
                              className="form-select"
                              value={a?.advice_type || 'general'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm((prev) => {
                                  const next = [...(prev.advices || [])];
                                  next[idx] = { ...next[idx], advice_type: val };
                                  return { ...prev, advices: next };
                                });
                              }}
                            >
                              {ADVICE_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Start Date</label>
                            <input
                              className="form-input"
                              type="date"
                              value={a?.start_date || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm((prev) => {
                                  const next = [...(prev.advices || [])];
                                  next[idx] = { ...next[idx], start_date: val };
                                  return { ...prev, advices: next };
                                });
                              }}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">End Date</label>
                            <input
                              className="form-input"
                              type="date"
                              value={a?.end_date || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm((prev) => {
                                  const next = [...(prev.advices || [])];
                                  next[idx] = { ...next[idx], end_date: val };
                                  return { ...prev, advices: next };
                                });
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              disabled={(form.advices || []).length <= 1}
                              onClick={() => {
                                setForm((prev) => {
                                  const next = [...(prev.advices || [])];
                                  next.splice(idx, 1);
                                  return { ...prev, advices: next.length ? next : [createEmptyAdvice()] };
                                });
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {String(a?.advice_type || 'general') === 'water_controling' ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label">Water Level</label>
                              <input
                                className="form-input"
                                type="number"
                                value={a?.water_amount ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setForm((prev) => {
                                    const next = [...(prev.advices || [])];
                                    next[idx] = { ...next[idx], water_amount: val };
                                    return { ...prev, advices: next };
                                  });
                                }}
                                placeholder="e.g. 20"
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label">Unit</label>
                              <select
                                className="form-select"
                                value={a?.water_unit || 'L'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setForm((prev) => {
                                    const next = [...(prev.advices || [])];
                                    next[idx] = { ...next[idx], water_unit: val };
                                    return { ...prev, advices: next };
                                  });
                                }}
                              >
                                <option value="L">Liters (L)</option>
                                <option value="ml">Milliliters (ml)</option>
                                <option value="m3">Cubic meters (m³)</option>
                              </select>
                            </div>
                          </div>
                        ) : null}

                        <div className="form-group" style={{ marginTop: '10px' }}>
                          <label className="form-label">Advice</label>
                          <textarea
                            className="form-input"
                            rows="2"
                            value={a?.advice_text || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setForm((prev) => {
                                const next = [...(prev.advices || [])];
                                next[idx] = { ...next[idx], advice_text: val };
                                return { ...prev, advices: next };
                              });
                            }}
                            placeholder={idx === 0 ? 'Write an advice for this crop...' : 'Write another advice...'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-actions">
                  <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={saveReco}>{editingId ? 'Update Task' : 'Assign Task'}</button>
                </div>
              </div>
              {resultHtml ? (<div dangerouslySetInnerHTML={{ __html: resultHtml }} />) : null}
            </div>
          </div>
        </div>
      ) : null}

      {viewOpen && viewItem ? (
        <div className="modal-overlay open" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setViewOpen(false); }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Recommendation Details</div>
              <button className="modal-close" onClick={() => setViewOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: 'var(--bg3)', padding: '16px', borderRadius: 'var(--radius2)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '12px' }}>Task Information</div>
                  <div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Type</div><div style={{ fontSize: '16px', fontWeight: 600 }}>{viewItem.recommendation_type === 'expert_task' ? '📋 Supervisor Task' : '🤖 Auto Advice'}</div></div>
                  <div style={{ marginTop: '8px' }}><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Related Crop</div><div style={{ fontSize: '14px' }}>Crop #{viewItem.crop_id}</div></div>
                  <div style={{ marginTop: '8px' }}><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Date Range</div><div style={{ fontSize: '14px', fontFamily: "'DM Mono'" }}>{viewItem.target_date || '—'} to {viewItem.target_date_end || '—'}</div></div>
                </div>
                <div style={{ background: 'var(--bg3)', padding: '16px', borderRadius: 'var(--radius2)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '12px' }}>Advice & Notes</div>
                  <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--text2)' }}>
                    {Array.isArray(viewItem.advices) && viewItem.advices.length ? (() => {
                      const rows = viewItem.advices
                        .map((a) => {
                          if (!a) return null;
                          if (typeof a === 'string') {
                            const txt = String(a).trim();
                            return txt ? { advice_text: txt } : null;
                          }
                          const txt = String(a.advice_text || '').trim();
                          if (!txt) return null;
                          return {
                            advice_text: txt,
                            advice_type: a.advice_type || '',
                            start_date: a.start_date || '',
                            end_date: a.end_date || '',
                            water_amount: a.water_amount ?? null,
                            water_unit: a.water_unit || '',
                          };
                        })
                        .filter(Boolean);
                      return rows.length ? (
                        <div style={{ marginTop: '4px', whiteSpace: 'pre-line' }}>
                          <strong>Advice:</strong>
                          {'\n'}
                          {rows.map((a, idx) => {
                            const type = a.advice_type ? `[${a.advice_type}] ` : '';
                            const dates = (a.start_date || a.end_date) ? `(${a.start_date || '—'} → ${a.end_date || '—'}) ` : '';
                            const water = (a.water_amount !== null && a.water_amount !== undefined && a.water_amount !== '')
                              ? `{water: ${a.water_amount}${a.water_unit ? ` ${a.water_unit}` : ''}} `
                              : '';
                            return `${idx + 1}. ${type}${dates}${water}${a.advice_text}`;
                          }).join('\n')}
                        </div>
                      ) : null;
                    })() : null}
                    {viewItem.fertilizer_advice ? (
                      <div style={{ marginTop: '4px' }}><strong>Fertilizer:</strong> {viewItem.fertilizer_advice}</div>
                    ) : null}
                    {viewItem.irrigation_advice ? (
                      <div style={{ marginTop: '4px' }}><strong>Irrigation:</strong> {viewItem.irrigation_advice}</div>
                    ) : null}
                    {viewItem.pest_alert ? (
                      <div style={{ marginTop: '4px' }}><strong>Pest Alerts:</strong> {viewItem.pest_alert}</div>
                    ) : null}
                    {viewItem.general_notes ? (
                      <div style={{ marginTop: '4px' }}><strong>Notes:</strong> {viewItem.general_notes}</div>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => { setViewOpen(false); openEditModal(viewItem.id); }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => { setViewOpen(false); deleteReco(viewItem.id); }}>Delete</button>
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
