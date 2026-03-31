import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest, getImageUrl } from '../api';
import { useToast } from '../components/ToastProvider';

export default function Dashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [crops, setCrops] = useState([]);
  const [weather, setWeather] = useState([]);
  const [soil, setSoil] = useState([]);
  const [recos, setRecos] = useState([]);
  const [cropImages, setCropImages] = useState([]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [c, w, s, r, ci] = await Promise.all([
        apiRequest('/api/crops'),
        apiRequest('/api/weather'),
        apiRequest('/api/soil'),
        apiRequest('/api/recommendations'),
        apiRequest('/api/crop_images'),
      ]);
      setCrops(Array.isArray(c) ? c : []);
      setWeather(Array.isArray(w) ? w : []);
      setSoil(Array.isArray(s) ? s : []);
      setRecos(Array.isArray(r) ? r : []);
      setCropImages(Array.isArray(ci) ? ci : []);
    } catch (e) {
      toast('Failed to load dashboard data. Ensure gateway + services are running.', 'error');
      setCrops([]);
      setWeather([]);
      setSoil([]);
      setRecos([]);
      setCropImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const recentCrops = useMemo(() => {
    const list = Array.isArray(crops) ? [...crops] : [];
    // Prefer stable deterministic ordering: newest ids first.
    list.sort((a, b) => String(b.id || b._id || '').localeCompare(String(a.id || a._id || '')));
    return list.slice(0, 5);
  }, [crops]);

  const latestWeather = useMemo(() => {
    const list = Array.isArray(weather) ? [...weather] : [];
    list.sort((a, b) => {
      const ad = `${a.date || ''} ${a.time || ''}`;
      const bd = `${b.date || ''} ${b.time || ''}`;
      return String(bd).localeCompare(String(ad));
    });
    return list.slice(0, 5);
  }, [weather]);

  const latestSoil = useMemo(() => {
    const list = Array.isArray(soil) ? [...soil] : [];
    list.sort((a, b) => String(b.recorded_date || '').localeCompare(String(a.recorded_date || '')));
    return list.slice(0, 5);
  }, [soil]);

  const recentRecos = useMemo(() => {
    const list = Array.isArray(recos) ? [...recos] : [];
    list.sort((a, b) => String(b.id || b._id || '').localeCompare(String(a.id || a._id || '')));
    return list.slice(0, 5);
  }, [recos]);

  return (
    <div className="page active">
      <div className="topbar">
        <div>
          <div className="page-title">Advanced Dashboard</div>
          <div className="page-sub">System overview across MongoDB collections (via services)</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-secondary" onClick={loadAll} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="content">
        <div
          className="stat-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
        >
          <div className="stat-card">
            <div className="stat-label">Crop</div>
            <div className="stat-value">{loading ? '—' : crops.length}</div>
            <div className="stat-desc">Total crop records</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Weather</div>
            <div className="stat-value">{loading ? '—' : weather.length}</div>
            <div className="stat-desc">Weather records saved</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Soil</div>
            <div className="stat-value">{loading ? '—' : soil.length}</div>
            <div className="stat-desc">Soil monitoring entries</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Recommendation</div>
            <div className="stat-value">{loading ? '—' : recos.length}</div>
            <div className="stat-desc">Tasks / advice assignments</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Crop Images</div>
            <div className="stat-value">{loading ? '—' : cropImages.length}</div>
            <div className="stat-desc">Library items for Add Crop</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Recent Crops</div>
              <div className="panel-sub">Latest 5 crops created/updated</div>
            </div>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            {recentCrops.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Crop</th>
                      <th>Farmer</th>
                      <th>Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCrops.map((c) => {
                      const id = c.id || c._id;
                      const imageUrl = getImageUrl(c.crop_image_path || (c.crop_image_name ? `/crop_images/${c.crop_image_name}` : ''));
                      return (
                        <tr key={id}>
                          <td style={{ fontFamily: "'DM Mono',monospace", color: 'var(--text3)' }}>#{id}</td>
                          <td className="td-main">
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={c.crop_name || 'Crop'}
                                  style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border2)' }}
                                />
                              ) : null}
                              <div>
                                <div style={{ color: 'var(--text)', fontWeight: 600 }}>{c.crop_name || '—'}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{c.crop_type || '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td>{c.farmer_name || '—'}</td>
                          <td>{[c.province, c.city, c.village].filter(Boolean).join(' / ') || c.field_location || '—'}</td>
                          <td><span className="badge badge-green">{c.status || '—'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state"><div className="empty-text">No crops available.</div></div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Latest Weather & Soil</div>
              <div className="panel-sub">Latest 5 entries from each service</div>
            </div>
          </div>
          <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--radius2)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border2)', fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Weather</div>
              {latestWeather.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Area</th>
                        <th>Date</th>
                        <th>Forecast</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestWeather.map((w) => (
                        <tr key={w.id}>
                          <td style={{ fontFamily: "'DM Mono',monospace", color: 'var(--text3)' }}>#{w.id}</td>
                          <td className="td-main">{w.area_name || '—'}</td>
                          <td style={{ fontFamily: "'DM Mono',monospace" }}>{w.date || '—'}</td>
                          <td><span className="badge badge-blue">{w.forecast_condition || '—'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '18px' }}><div className="empty-text">No weather records.</div></div>
              )}
            </div>

            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--radius2)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border2)', fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Soil</div>
              {latestSoil.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Field</th>
                        <th>Type</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestSoil.map((s) => (
                        <tr key={s.id}>
                          <td style={{ fontFamily: "'DM Mono',monospace", color: 'var(--text3)' }}>#{s.id}</td>
                          <td className="td-main">{s.field_name || '—'}</td>
                          <td>{s.soil_type || '—'}</td>
                          <td style={{ fontFamily: "'DM Mono',monospace" }}>{s.recorded_date || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '18px' }}><div className="empty-text">No soil records.</div></div>
              )}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Recent Recommendations</div>
              <div className="panel-sub">Latest 5 tasks/advice assignments</div>
            </div>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            {recentRecos.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Crop</th>
                      <th>Type</th>
                      <th>Date Range</th>
                      <th>Advices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRecos.map((r) => {
                      const id = r.id || r._id;
                      const advicesCount = Array.isArray(r.advices) ? r.advices.filter(Boolean).length : 0;
                      const range = (r.target_date || r.target_date_end) ? `${r.target_date || '—'} → ${r.target_date_end || '—'}` : '—';
                      return (
                        <tr key={id}>
                          <td style={{ fontFamily: "'DM Mono',monospace", color: 'var(--text3)' }}>#{id}</td>
                          <td className="td-main">#{r.crop_id || '—'}</td>
                          <td>{r.recommendation_type || '—'}</td>
                          <td style={{ fontFamily: "'DM Mono',monospace" }}>{range}</td>
                          <td>{advicesCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state"><div className="empty-text">No recommendations available.</div></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
