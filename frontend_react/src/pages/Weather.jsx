import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { apiRequest, WEATHER_API } from '../api';
import { useToast } from '../components/ToastProvider';
import { mapWeatherCode, SRI_LANKA_CITIES } from '../utils/weather';
import { VILLAGES_BY_CITY } from '../utils/sriLankaLocations';

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

const EMPTY_FORM = {
  crop_id: '',
  time: '',
  area_name: '',
  date: '',
  temperature: '',
  humidity: '',
  rainfall: '',
  wind_speed: '',
  forecast_condition: 'sunny',
};

export default function Weather() {
  const toast = useToast();
  const [weather, setWeather] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [crops, setCrops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [province, setProvince] = useState('');
  const [cityIndex, setCityIndex] = useState('');
  const [village, setVillage] = useState('');
  const [realtime, setRealtime] = useState({
    temp: '—', humidity: '—', rain: '—', wind: '—', condition: '—', note: 'Choose a province to load live data via Open-Meteo.'
  });

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapContainerRef = useRef(null);

  const normalizeForecastCondition = (raw) => {
    const s = String(raw || '').trim().toLowerCase();
    if (!s) return 'sunny';
    if (s.includes('thunder') || s.includes('storm')) return 'stormy';
    if (s.includes('rain') || s.includes('drizzle') || s.includes('shower')) return 'rainy';
    if (s.includes('cloud') || s.includes('overcast') || s.includes('fog')) return 'partly cloudy';
    if (s.includes('clear')) return 'sunny';
    return 'sunny';
  };

  useEffect(() => {
    // Ensure marker icons resolve correctly in Vite builds.
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
  }, []);

  const cities = useMemo(() => {
    return province && SRI_LANKA_CITIES[province] ? SRI_LANKA_CITIES[province] : [];
  }, [province]);

  const selectedCityName = useMemo(() => {
    if (cityIndex === '') return '';
    const idx = parseInt(cityIndex, 10);
    return Number.isNaN(idx) ? '' : (cities[idx]?.name || '');
  }, [cityIndex, cities]);

  const villageOptions = useMemo(() => {
    if (!selectedCityName) return [];
    return VILLAGES_BY_CITY[selectedCityName] || [];
  }, [selectedCityName]);

  const loadWeather = async () => {
    try {
      const data = await apiRequest('/api/weather');
      setWeather(data);
    } catch (e) {
      toast('Cannot load weather data.', 'error');
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
    loadWeather();
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    loadCrops();
    setVillage('');
    setTimeout(() => {
      if (!mapRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current).setView([7.8731, 80.7718], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 12,
          minZoom: 6,
        }).addTo(map);
        map.on('click', (e) => {
          const lat = e.latlng.lat;
          const lon = e.latlng.lng;
          if (lat >= 5.9 && lat <= 9.9 && lon >= 79.5 && lon <= 81.9) {
            placeMarker(lat, lon);
            fetchRealTimeWeather({ lat, lon, name: `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}` }, { applyToForm: true });
          } else {
            toast('Please click inside Sri Lanka.', 'error');
          }
        });
        mapRef.current = map;
      }
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 120);
  }, [modalOpen]);

  const placeMarker = (lat, lon) => {
    if (!mapRef.current) return;
    if (markerRef.current) mapRef.current.removeLayer(markerRef.current);
    markerRef.current = L.marker([lat, lon]).addTo(mapRef.current);
    mapRef.current.setView([lat, lon], 11);
  };

  const fetchRealTimeWeather = async (area, options = {}) => {
    const { applyToForm = true } = options;
    setRealtime((prev) => ({ ...prev, note: `Loading live data for ${area.name}...` }));
    try {
      const params = new URLSearchParams({
        latitude: area.lat,
        longitude: area.lon,
        current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code',
        timezone: 'Asia/Colombo',
      });
      const r = await fetch(`${WEATHER_API}?${params.toString()}`);
      if (!r.ok) throw new Error('Weather API error');
      const data = await r.json();
      const current = data.current || {};
      const temp = current.temperature_2m;
      const humidity = current.relative_humidity_2m;
      const rain = current.precipitation;
      const wind = current.wind_speed_10m;
      const condition = mapWeatherCode(current.weather_code);

      setRealtime({
        temp: `${temp ?? '—'}°C`,
        humidity: humidity !== undefined ? `${humidity}%` : '—',
        rain: rain !== undefined ? `${rain} mm` : '—',
        wind: wind !== undefined ? `${wind} km/h` : '—',
        condition,
        note: `Live data updated · ${data.current?.time || 'now'}`,
      });

      if (applyToForm) {
        setForm((prev) => ({
          ...prev,
          area_name: area.name,
          date: (data.current?.time || new Date().toISOString()).split('T')[0],
          temperature: temp ?? '',
          humidity: humidity ?? '',
          rainfall: rain ?? '',
          wind_speed: wind ?? '',
          forecast_condition: normalizeForecastCondition(condition),
        }));
      }
    } catch (e) {
      setRealtime((prev) => ({ ...prev, note: 'Could not load live data. Try again later.' }));
      toast('Weather API unavailable', 'error');
    }
  };

  const handleCitySelect = (idx) => {
    setCityIndex(idx);
    const city = cities[parseInt(idx, 10)];
    if (!city) return;
    placeMarker(city.lat, city.lon);
    fetchRealTimeWeather({ lat: city.lat, lon: city.lon, name: city.name }, { applyToForm: true });
    setVillage('');
  };

  const syncLocationFromCrop = (crop) => {
    const cropProvince = crop?.province || '';
    const cropCity = crop?.city || '';
    const cropVillage = crop?.village || '';

    let resolvedProvince = cropProvince;

    if (cropCity) {
      const provinceCities = resolvedProvince ? (SRI_LANKA_CITIES[resolvedProvince] || []) : [];
      const cityInProvince = provinceCities.some((c) => c.name === cropCity);

      if (!resolvedProvince || !cityInProvince) {
        const found = Object.entries(SRI_LANKA_CITIES).find(([, list]) => list.some((c) => c.name === cropCity));
        if (found) resolvedProvince = found[0];
      }
    }

    if (resolvedProvince) {
      setProvince(resolvedProvince);
    }

    if (resolvedProvince && cropCity) {
      const list = SRI_LANKA_CITIES[resolvedProvince] || [];
      const idx = list.findIndex((c) => c.name === cropCity);
      if (idx >= 0) {
        setCityIndex(String(idx));
        const city = list[idx];
        placeMarker(city.lat, city.lon);
        fetchRealTimeWeather({ lat: city.lat, lon: city.lon, name: city.name }, { applyToForm: false });
      } else {
        setCityIndex('');
      }
    } else {
      setCityIndex('');
    }

    if (cropVillage && cropCity) {
      const opts = VILLAGES_BY_CITY[cropCity] || [];
      setVillage(opts.includes(cropVillage) ? cropVillage : '');
    } else {
      setVillage('');
    }

    setForm((prev) => ({
      ...prev,
      area_name: crop.field_location || cropVillage || cropCity || resolvedProvince || prev.area_name || '',
    }));
  };

  const searchMapLoc = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', Sri Lanka')}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        placeMarker(lat, lon);
        fetchRealTimeWeather({ lat, lon, name: data[0].display_name.split(',')[0] }, { applyToForm: true });
      } else {
        toast('Location not found in Sri Lanka', 'error');
      }
    } catch (e) {
      toast('Search failed', 'error');
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setProvince('');
    setCityIndex('');
    setVillage('');
    setSearchQuery('');
    setModalOpen(true);
  };

  const openEditModal = async (id) => {
    try {
      const w = await apiRequest(`/api/weather/${id}`);
      setEditingId(id);
      setForm({
        crop_id: (w.crop_id === null || w.crop_id === undefined) ? '' : String(w.crop_id),
        time: w.time || '',
        area_name: w.area_name || '',
        date: w.date || '',
        temperature: w.temperature ?? '',
        humidity: w.humidity ?? '',
        rainfall: w.rainfall ?? '',
        wind_speed: w.wind_speed ?? '',
        forecast_condition: normalizeForecastCondition(w.forecast_condition || 'sunny'),
      });
      setProvince('');
      setCityIndex('');
      setVillage('');
      setSearchQuery('');
      setModalOpen(true);
    } catch (e) {
      toast('Failed to load weather for editing', 'error');
    }
  };

  useEffect(() => {
    if (!modalOpen) return;
    if (!form.crop_id) return;
    const crop = crops.find((c) => String(c.id) === String(form.crop_id));
    if (crop) syncLocationFromCrop(crop);
  }, [modalOpen, form.crop_id, crops]);

  const openView = async (id) => {
    try {
      const w = await apiRequest(`/api/weather/${id}`);
      setViewItem(w);
      setViewOpen(true);
    } catch (e) {
      toast('Failed to load weather details', 'error');
    }
  };

  const saveWeather = async () => {
    if (!form.area_name || !form.date) {
      toast('Area and date required', 'error');
      return;
    }
    const body = {
      crop_id: form.crop_id || null,
      time: form.time || null,
      area_name: form.area_name,
      date: form.date,
      temperature: form.temperature === '' ? null : parseFloat(form.temperature),
      humidity: form.humidity === '' ? null : parseFloat(form.humidity),
      rainfall: form.rainfall === '' ? null : parseFloat(form.rainfall),
      wind_speed: form.wind_speed === '' ? null : parseFloat(form.wind_speed),
      forecast_condition: form.forecast_condition,
    };
    try {
      if (editingId) {
        await apiRequest(`/api/weather/${editingId}`, 'PUT', body);
        toast('Weather updated!');
      } else {
        await apiRequest('/api/weather', 'POST', body);
        toast('Weather record added!');
      }
      setModalOpen(false);
      setEditingId(null);
      loadWeather();
    } catch (e) {
      toast('Failed to save', 'error');
    }
  };

  const deleteWeather = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await apiRequest(`/api/weather/${id}`, 'DELETE');
      toast('Deleted');
      loadWeather();
    } catch (e) {
      toast('Delete failed', 'error');
    }
  };

  return (
    <div className="page active">
      <div className="topbar">
        <div><div className="page-title">Weather Data</div><div className="page-sub">Member 2 — POST /api/weather</div></div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>+ Add Record</button>
        </div>
      </div>
      <div className="content">
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Weather Records</div></div>
          <div className="panel-body" style={{ padding: 0 }}>
            <div id="weather-table">
              {loading ? (<div className="loading">Loading weather...</div>) : null}
              {!loading && !weather.length ? (
                <div className="empty-state"><div className="empty-icon">🌤</div><div className="empty-text">No weather records yet.</div></div>
              ) : null}
              {weather.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>ID</th><th>Area</th><th>Date</th><th>Temp °C</th><th>Humidity %</th><th>Rainfall mm</th><th>Wind km/h</th><th>Forecast</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {weather.map((w) => (
                        <tr key={w.id}>
                          <td style={{ fontFamily: "'DM Mono',monospace", color: 'var(--text3)' }}>#{w.id}</td>
                          <td className="td-main">{w.area_name}</td>
                          <td style={{ fontFamily: "'DM Mono',monospace" }}>{w.date}</td>
                          <td>{w.temperature ?? '—'}</td>
                          <td>{w.humidity ?? '—'}</td>
                          <td>{w.rainfall ?? '—'}</td>
                          <td>{w.wind_speed ?? '—'}</td>
                          <td><span className="badge badge-blue">{w.forecast_condition || '—'}</span></td>
                          <td style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-info btn-sm" onClick={() => openView(w.id)}>View</button>
                            <button className="btn btn-warning btn-sm" onClick={() => openEditModal(w.id)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteWeather(w.id)}>Delete</button>
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
      </div>

      {modalOpen ? (
        <div className="modal-overlay open" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setModalOpen(false); }}>
          <div className="modal modal-large">
            <div className="modal-header">
              <div className="modal-title">{editingId ? 'Edit Weather Record' : 'Add Weather Record'}</div>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="modal-body modal-large-body">
              <div className="weather-map-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="map-shell">
                  <div className="map-title">Select a location to fetch live weather</div>
                  <div className="map-sub">Click anywhere on the map to auto-fill the weather form.</div>
                  <div className="map-tools">
                    <div className="map-tool-row">
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search city or area..." onKeyDown={(e) => { if (e.key === 'Enter') searchMapLoc(); }} />
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={searchMapLoc}>Search</button>
                    </div>
                    <div className="map-tool-row">
                      <select value={province} onChange={(e) => { setProvince(e.target.value); setCityIndex(''); }}>
                        <option value="">Select Province...</option>
                        {Object.keys(SRI_LANKA_CITIES).map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <select value={cityIndex} onChange={(e) => handleCitySelect(e.target.value)}>
                        <option value="">Select City...</option>
                        {cities.map((c, idx) => (
                          <option key={c.name} value={idx}>{c.name}</option>
                        ))}
                      </select>
                      <select value={village} onChange={(e) => setVillage(e.target.value)} disabled={!selectedCityName}>
                        <option value="">Select Village...</option>
                        {villageOptions.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div id="sl-map-container" ref={mapContainerRef}></div>
                </div>
                <div className="weather-realtime">
                  <div className="realtime-title">Real-time weather</div>
                  <div className="realtime-value" id="realtime-temp">{realtime.temp}</div>
                  <div className="realtime-row"><span>Humidity</span><span id="realtime-humidity">{realtime.humidity}</span></div>
                  <div className="realtime-row"><span>Rainfall</span><span id="realtime-rain">{realtime.rain}</span></div>
                  <div className="realtime-row"><span>Wind</span><span id="realtime-wind">{realtime.wind}</span></div>
                  <div className="realtime-row"><span>Condition</span><span className="realtime-chip" id="realtime-condition">{realtime.condition}</span></div>
                  <div className="realtime-note" id="realtime-note">{realtime.note}</div>
                </div>
              </div>

              <div>
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Link to Crop (Optional)</label>
                    <select
                      className="form-select"
                      value={form.crop_id}
                      onChange={(e) => {
                        const cropId = e.target.value;
                        setForm((prev) => ({ ...prev, crop_id: cropId }));
                        const crop = crops.find((c) => String(c.id) === String(cropId));
                        if (crop) syncLocationFromCrop(crop);
                      }}
                    >
                      <option value="">-- No linked crop --</option>
                      {crops.map((c) => (
                        <option key={c.id} value={c.id}>{c.crop_name} ({c.field_location || 'N/A'})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Time</label><input className="form-input" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Area Name *</label><input className="form-input" value={form.area_name} onChange={(e) => setForm({ ...form, area_name: e.target.value })} placeholder="e.g. Kurunegala" /></div>
                  <div className="form-group"><label className="form-label">Date *</label><input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Temperature (°C)</label><input className="form-input" type="number" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} placeholder="e.g. 30" /></div>
                  <div className="form-group"><label className="form-label">Humidity (%)</label><input className="form-input" type="number" value={form.humidity} onChange={(e) => setForm({ ...form, humidity: e.target.value })} placeholder="e.g. 75" /></div>
                  <div className="form-group"><label className="form-label">Rainfall (mm)</label><input className="form-input" type="number" value={form.rainfall} onChange={(e) => setForm({ ...form, rainfall: e.target.value })} placeholder="e.g. 12" /></div>
                  <div className="form-group"><label className="form-label">Wind Speed (km/h)</label><input className="form-input" type="number" value={form.wind_speed} onChange={(e) => setForm({ ...form, wind_speed: e.target.value })} placeholder="e.g. 15" /></div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Forecast Condition</label>
                    <div className="crop-library-grid" style={{ maxHeight: 'none' }}>
                      {WEATHER_CONDITIONS.map((t) => {
                        const isSelected = form.forecast_condition === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            className={`crop-tile ${isSelected ? 'selected' : ''}`}
                            onClick={() => setForm((prev) => ({ ...prev, forecast_condition: t.value }))}
                            aria-pressed={isSelected}
                          >
                            <img src={t.image_url} alt={t.label} loading="lazy" />
                            <div className="crop-tile-title">{t.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={saveWeather}>Save Record</button>
                  </div>
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
              <div className="modal-title">Weather Details</div>
              <button className="modal-close" onClick={() => setViewOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: 'var(--bg3)', padding: '16px', borderRadius: 'var(--radius2)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '12px' }}>Location & Time</div>
                  <div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Area</div><div style={{ fontSize: '16px', fontWeight: 600 }}>{viewItem.area_name || '—'}</div></div>
                  <div style={{ marginTop: '8px' }}><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Date</div><div style={{ fontSize: '14px', fontFamily: "'DM Mono'" }}>{viewItem.date || '—'}</div></div>
                  <div style={{ marginTop: '8px' }}><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Time</div><div style={{ fontSize: '14px', fontFamily: "'DM Mono'" }}>{viewItem.time || '—'}</div></div>
                </div>
                <div style={{ background: 'var(--bg3)', padding: '16px', borderRadius: 'var(--radius2)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '12px' }}>Weather Data</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Temp</div><div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--blue)' }}>{viewItem.temperature !== null ? `${viewItem.temperature}°C` : '—'}</div></div>
                    <div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Humidity</div><div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--blue)' }}>{viewItem.humidity !== null ? `${viewItem.humidity}%` : '—'}</div></div>
                    <div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Rainfall</div><div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--blue)' }}>{viewItem.rainfall !== null ? `${viewItem.rainfall}mm` : '—'}</div></div>
                    <div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Wind</div><div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--blue)' }}>{viewItem.wind_speed !== null ? `${viewItem.wind_speed}km/h` : '—'}</div></div>
                  </div>
                  <div style={{ marginTop: '12px' }}><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Forecast</div><div style={{ fontSize: '14px' }}>{viewItem.forecast_condition || '—'}</div></div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => { setViewOpen(false); openEditModal(viewItem.id); }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => { setViewOpen(false); deleteWeather(viewItem.id); }}>Delete</button>
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
