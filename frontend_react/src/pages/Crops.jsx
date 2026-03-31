import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest, getImageUrl } from '../api';
import { useToast } from '../components/ToastProvider';
import { PROVINCES, CITIES_BY_PROVINCE, VILLAGES_BY_CITY } from '../utils/sriLankaLocations';

const EMPTY_FORM = {
  crop_name: '',
  crop_type: '',
  planting_date: '',
  harvest_date: '',
  province: '',
  city: '',
  village: '',
  field_location: '',
  farmer_name: '',
  status: 'growing',
};

export default function Crops() {
  const toast = useToast();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create | view | edit
  const [activeCropId, setActiveCropId] = useState(null);
  const [imageOptions, setImageOptions] = useState([]);
  const [selectedImageName, setSelectedImageName] = useState('');
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  const resolveOptionImageUrl = (img) => {
    const url = img?.image_url || (img?.crop_image_name ? `/crop_images/${img.crop_image_name}` : '');
    return getImageUrl(url);
  };

  const resolveStoredImageUrl = (urlOrPath) => getImageUrl(urlOrPath || '');

  const isReadOnly = modalMode === 'view';

  const cityOptions = useMemo(() => {
    if (!selectedProvince) return [];
    return CITIES_BY_PROVINCE[selectedProvince] || [];
  }, [selectedProvince]);

  const villageOptions = useMemo(() => {
    if (!selectedCity) return [];
    return VILLAGES_BY_CITY[selectedCity] || [];
  }, [selectedCity]);

  const loadCrops = async () => {
    try {
      const data = await apiRequest('/api/crops');
      setCrops(data);
    } catch (e) {
      toast('Cannot load crops. Is the Crop Service running?', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async () => {
    try {
      const data = await apiRequest('/api/crop_images');
      setImageOptions(data);
    } catch (e) {
      setImageOptions([]);
    }
  };

  useEffect(() => {
    loadCrops();
    loadImages();
  }, []);

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setSelectedImageName('');
    setSelectedImageUrl('');
    setSelectedProvince('');
    setSelectedCity('');
    setActiveCropId(null);
    setModalMode('create');
    setCropModalOpen(true);
  };

  const closeModal = () => {
    setCropModalOpen(false);
    setForm(EMPTY_FORM);
    setSelectedImageName('');
    setSelectedImageUrl('');
    setSelectedProvince('');
    setSelectedCity('');
    setActiveCropId(null);
    setModalMode('create');
  };

  const openFromExistingCrop = (crop, mode) => {
    setActiveCropId(crop.id || crop._id || null);
    setModalMode(mode);

    const nextForm = {
      ...EMPTY_FORM,
      crop_name: crop.crop_name || '',
      crop_type: crop.crop_type || '',
      planting_date: crop.planting_date || '',
      harvest_date: crop.harvest_date || '',
      province: crop.province || '',
      city: crop.city || '',
      village: crop.village || '',
      field_location: crop.field_location || '',
      farmer_name: crop.farmer_name || '',
      status: crop.status || 'growing',
    };

    setForm(nextForm);
    setSelectedProvince(nextForm.province || '');
    setSelectedCity(nextForm.city || '');

    const existingName = crop.crop_image_name || '';
    const existingUrl = crop.crop_image_path || '';

    let nextSelectedName = existingName;
    let nextSelectedUrl = existingUrl;

    // If only one of (name/url) is present, try to resolve the other from crop_images.
    if ((existingName || existingUrl) && imageOptions.length) {
      const resolvedExistingUrl = resolveStoredImageUrl(existingUrl);
      const found = imageOptions.find((img) => {
        if (existingName && img.crop_image_name === existingName) return true;
        if (resolvedExistingUrl && resolveOptionImageUrl(img) === resolvedExistingUrl) return true;
        return false;
      });

      if (found) {
        if (!nextSelectedName) nextSelectedName = found.crop_image_name || '';
        if (!nextSelectedUrl) nextSelectedUrl = found.image_url || (found.crop_image_name ? `/crop_images/${found.crop_image_name}` : '');
      }
    }

    setSelectedImageName(nextSelectedName);
    setSelectedImageUrl(nextSelectedUrl);
    setCropModalOpen(true);
  };

  const handleDeleteCrop = async (crop) => {
    const cropId = crop.id || crop._id;
    if (!cropId) {
      toast('Cannot delete: missing crop id', 'error');
      return;
    }
    const ok = window.confirm(`Delete crop "${crop.crop_name || 'this crop'}"?`);
    if (!ok) return;

    try {
      await apiRequest(`/api/crops/${cropId}`, 'DELETE');
      toast('Crop deleted');
      loadCrops();
    } catch (e) {
      toast('Failed to delete crop', 'error');
    }
  };

  const syncFromImage = (image) => {
    setSelectedImageName(image.crop_image_name || '');
    setSelectedImageUrl(image.image_url || '');
    setForm((prev) => ({
      ...prev,
      crop_name: image.crop_name || '',
      crop_type: image.crop_type || '',
    }));
  };

  const handleProvinceChange = (province) => {
    setSelectedProvince(province);
    setSelectedCity('');
    setForm((prev) => ({
      ...prev,
      province,
      city: '',
      village: '',
    }));
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    setForm((prev) => ({
      ...prev,
      city,
      village: '',
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (isReadOnly) {
      closeModal();
      return;
    }

    if (!form.crop_name || !form.crop_type || !form.farmer_name) {
      toast('Crop name, crop type, and farmer name are required', 'error');
      return;
    }

    try {
      const body = {
        ...form,
        crop_image_name: selectedImageName || null,
        crop_image_path: selectedImageUrl || null,
        planting_date: form.planting_date || null,
        harvest_date: form.harvest_date || null,
        province: form.province || null,
        city: form.city || null,
        village: form.village || null,
        field_location: form.field_location || null,
      };

      if (modalMode === 'edit') {
        if (!activeCropId) {
          toast('Cannot update: missing crop id', 'error');
          return;
        }
        await apiRequest(`/api/crops/${activeCropId}`, 'PUT', body);
        toast('Crop updated successfully!');
      } else {
        await apiRequest('/api/crops', 'POST', body);
        toast('Crop created successfully!');
      }

      closeModal();
      loadCrops();
    } catch (e) {
      toast(modalMode === 'edit' ? 'Failed to update crop' : 'Failed to create crop', 'error');
    }
  };

  return (
    <div className="page active">
      <div className="topbar">
        <div>
          <div className="page-title">Crop Management</div>
          <div className="page-sub">Add a crop from crop images and fill the required details</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>+ Add Crop</button>
        </div>
      </div>

      <div className="content">
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Existing Crops</div></div>
          <div className="panel-body">
            <div className="crop-grid">
              {loading ? (<div className="loading">Loading crops...</div>) : null}
              {!loading && !crops.length ? (
                <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                  <div className="empty-icon">🌱</div>
                  <div className="empty-text">No crops yet. Use Add Crop to create the first one.</div>
                </div>
              ) : null}
              {crops.map((crop) => {
                const cropId = crop.id || crop._id;
                const imageUrl = getImageUrl(crop.crop_image_path || (crop.crop_image_name ? `/crop_images/${crop.crop_image_name}` : ''));

                return (
                  <div className="crop-card" key={cropId}>
                    {imageUrl ? <img className="crop-card-img" src={imageUrl} alt={crop.crop_name} /> : <div className="crop-image-fallback">🌿</div>}
                    <div className="crop-card-body">
                      <div className="crop-card-title">{crop.crop_name}</div>
                      <div className="crop-card-meta">{crop.crop_type || '—'} · {crop.field_location || 'Field unassigned'}</div>
                      <div className="crop-card-row" style={{ justifyContent: 'space-between', marginTop: '10px' }}>
                        <span className="crop-card-meta">{crop.province || '—'}</span>
                        <span className="badge badge-green">{crop.status || 'growing'}</span>
                      </div>

                      <div className="crop-card-row" style={{ justifyContent: 'flex-end', marginTop: '10px' }}>
                        <div className="crop-card-actions">
                          <button type="button" className="btn btn-info btn-sm" onClick={() => openFromExistingCrop(crop, 'view')}>View</button>
                          <button type="button" className="btn btn-warning btn-sm" onClick={() => openFromExistingCrop(crop, 'edit')}>Edit</button>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteCrop(crop)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {cropModalOpen ? (
        <div className="modal-overlay open" onClick={(event) => { if (event.target.classList.contains('modal-overlay')) closeModal(); }}>
          <div className="modal" style={{ width: '760px' }}>
            <div className="modal-header">
              <div className="modal-title">
                {modalMode === 'edit' ? 'Edit Crop' : modalMode === 'view' ? 'View Crop' : 'Add New Crop'}
              </div>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form className="modal-body" onSubmit={handleSave}>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 600, marginBottom: '10px' }}>Quick Select from Crop Library</div>
                <select
                  className="form-select"
                  value={selectedImageName}
                  disabled={isReadOnly}
                  onChange={(e) => {
                    const selected = imageOptions.find((img) => img.crop_image_name === e.target.value);
                    if (selected) {
                      syncFromImage(selected);
                    } else {
                      setSelectedImageName('');
                      setSelectedImageUrl('');
                    }
                  }}
                >
                  <option value="">-- Select a crop to auto-fill --</option>
                  {imageOptions.map((img) => (
                    <option key={img.id} value={img.crop_image_name}>
                      {img.crop_name} ({img.crop_type})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600 }}>Select Crop Image</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>{selectedImageName || 'none selected'}</div>
                </div>

                {imageOptions.length ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                    {imageOptions.map((img) => {
                      const isActive = !!resolveStoredImageUrl(selectedImageUrl) && resolveStoredImageUrl(selectedImageUrl) === resolveOptionImageUrl(img);
                      return (
                        <button
                          key={img.id}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => { if (!isReadOnly) syncFromImage(img); }}
                          style={{
                            textAlign: 'left',
                            border: isActive ? '2px solid #36b37e' : '1px solid #2f4f2f',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            background: isActive ? 'rgba(54,179,126,0.08)' : '#0f1b0f',
                            color: 'inherit',
                            cursor: isReadOnly ? 'default' : 'pointer',
                            padding: 0,
                            opacity: isReadOnly ? 0.85 : 1,
                          }}
                        >
                          <img
                            src={img.image_url || getImageUrl(img.crop_image_name)}
                            alt={img.crop_name}
                            style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }}
                          />
                          <div style={{ padding: '10px' }}>
                            <div style={{ fontWeight: 700, fontSize: '13px' }}>{img.crop_name}</div>
                            <div style={{ fontSize: '12px', color: '#8ab38a', marginTop: '2px' }}>{img.crop_type}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: '#a8b3a8', padding: '12px 0' }}>No images available in the crop_images collection.</div>
                )}

                {selectedImageUrl ? (
                  <div style={{ marginTop: '14px', display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', border: '1px solid #2f4f2f', borderRadius: '10px', background: 'rgba(54,179,126,0.06)' }}>
                    <img src={selectedImageUrl} alt={form.crop_name || 'Selected crop'} style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', flex: '0 0 auto' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>{form.crop_name || 'Selected crop'}</div>
                      <div style={{ fontSize: '12px', color: '#8ab38a', marginTop: '2px' }}>{form.crop_type || ''}</div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Crop Name *</label>
                  <input className="form-input" value={form.crop_name} disabled={isReadOnly} onChange={(e) => setForm({ ...form, crop_name: e.target.value })} placeholder="e.g. Rice, Corn" />
                </div>
                <div className="form-group">
                  <label className="form-label">Crop Type *</label>
                  <input className="form-input" value={form.crop_type} disabled={isReadOnly} onChange={(e) => setForm({ ...form, crop_type: e.target.value })} placeholder="e.g. Grain, Vegetable" />
                </div>
                <div className="form-group">
                  <label className="form-label">Planting Date</label>
                  <input className="form-input" disabled={isReadOnly} type="date" value={form.planting_date} onChange={(e) => setForm({ ...form, planting_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Harvest Date</label>
                  <input className="form-input" disabled={isReadOnly} type="date" value={form.harvest_date} onChange={(e) => setForm({ ...form, harvest_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Province</label>
                  <select className="form-select" disabled={isReadOnly} value={form.province} onChange={(e) => handleProvinceChange(e.target.value)}>
                    <option value="">Select Province...</option>
                    {PROVINCES.map((province) => <option key={province} value={province}>{province}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <select className="form-select" value={form.city} onChange={(e) => handleCityChange(e.target.value)} disabled={isReadOnly || !selectedProvince}>
                    <option value="">Select City...</option>
                    {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Village</label>
                  <select className="form-select" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} disabled={isReadOnly || !selectedCity}>
                    <option value="">Select Village...</option>
                    {villageOptions.map((village) => <option key={village} value={village}>{village}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Field Location</label>
                  <input className="form-input" disabled={isReadOnly} value={form.field_location} onChange={(e) => setForm({ ...form, field_location: e.target.value })} placeholder="e.g. North Field A" />
                </div>
                <div className="form-group">
                  <label className="form-label">Farmer Name *</label>
                  <input className="form-input" disabled={isReadOnly} value={form.farmer_name} onChange={(e) => setForm({ ...form, farmer_name: e.target.value })} placeholder="e.g. Kamal Perera" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" disabled={isReadOnly} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="growing">Growing</option>
                    <option value="planned">Planned</option>
                    <option value="harvested">Harvested</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={closeModal}>{isReadOnly ? 'Close' : 'Cancel'}</button>
                  {!isReadOnly ? (
                    <button type="submit" className="btn btn-primary">{modalMode === 'edit' ? 'Save Changes' : 'Save Crop'}</button>
                  ) : null}
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
