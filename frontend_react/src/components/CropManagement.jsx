import React, { useState, useEffect } from 'react';
import { api, getImageUrl } from '../api';
import { PROVINCES, CITIES_BY_PROVINCE, VILLAGES_BY_CITY } from '../utils/sriLankaLocations';

export default function CropManagement() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [cropImages, setCropImages] = useState([]);
  const [formData, setFormData] = useState(getDefaultFormData());
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedVillages, setSelectedVillages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function getDefaultFormData() {
    return {
      crop_image_id: '',
      crop_image_name: '',
      crop_name: '',
      crop_type: '',
      planting_date: '',
      harvest_date: '',
      province: '',
      city: '',
      village: '',
      field_location: '',
      farmer_name: '',
      status: 'active'
    };
  }

  useEffect(() => {
    fetchCrops();
    fetchCropImages();
  }, []);

  const fetchCrops = async () => {
    try {
      const res = await api.get('/api/crops');
      setCrops(res.data);
    } catch (err) {
      console.error('Error fetching crops', err);
      alert('Failed to load crops');
    } finally {
      setLoading(false);
    }
  };

  const fetchCropImages = async () => {
    try {
      const res = await api.get('/api/crop-images');
      setCropImages(res.data);
    } catch (err) {
      console.error('Error fetching crop images', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this crop?')) return;
    try {
      await api.delete(`/api/crops/${id}`);
      fetchCrops();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleCropImageSelect = (cropImage) => {
    setFormData(prev => ({
      ...prev,
      crop_image_id: cropImage._id || cropImage.id,
      crop_image_name: cropImage.crop_image_name || '',
      crop_name: cropImage.crop_name || '',
      crop_type: cropImage.crop_type || ''
    }));
  };

  const handleProvinceChange = (province) => {
    setFormData(prev => ({
      ...prev,
      province,
      city: '',
      village: ''
    }));
    setSelectedCities(CITIES_BY_PROVINCE[province] || []);
    setSelectedVillages([]);
  };

  const handleCityChange = (city) => {
    setFormData(prev => ({
      ...prev,
      city,
      village: ''
    }));
    setSelectedVillages(VILLAGES_BY_CITY[city] || []);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    
    if (!formData.crop_name || !formData.crop_type || !formData.farmer_name || !formData.province) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/crops', formData);
      alert('Crop created successfully!');
      setShowForm(false);
      setFormData(getDefaultFormData());
      fetchCrops();
    } catch (err) {
      console.error('Error creating crop', err);
      alert('Failed to create crop: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData(getDefaultFormData());
    setSelectedCities([]);
    setSelectedVillages([]);
  };

  if (loading) return <div>Loading crops...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Crop Management</h2>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 20px',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          ➕ Add Crop
        </button>
      </div>

      {/* Add Crop Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Create New Crop</h3>

            {/* Crop Image Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Select Crop Image
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: '10px',
                marginBottom: '15px',
                maxHeight: '250px',
                overflowY: 'auto',
                border: '1px solid #ddd',
                padding: '10px',
                borderRadius: '8px'
              }}>
                {cropImages.map((img) => (
                  <div
                    key={img._id || img.id}
                    onClick={() => handleCropImageSelect(img)}
                    style={{
                      cursor: 'pointer',
                      border: formData.crop_image_id === (img._id || img.id) ? '3px solid #4caf50' : '2px solid #ddd',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      background: formData.crop_image_id === (img._id || img.id) ? '#f0f8f0' : 'white'
                    }}
                  >
                    <img
                      src={getImageUrl(img.crop_image_name)}
                      alt={img.crop_name}
                      style={{
                        width: '100%',
                        height: '100px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ padding: '5px', fontSize: '12px', textAlign: 'center' }}>
                      {img.crop_name}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmitForm}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Crop Name *
                </label>
                <input
                  type="text"
                  name="crop_name"
                  value={formData.crop_name}
                  onChange={handleFormChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Crop name (auto-filled from image)"
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Crop Type *
                </label>
                <input
                  type="text"
                  name="crop_type"
                  value={formData.crop_type}
                  onChange={handleFormChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Crop type (auto-filled from image)"
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Planting Date
                </label>
                <input
                  type="date"
                  name="planting_date"
                  value={formData.planting_date}
                  onChange={handleFormChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Harvest Date
                </label>
                <input
                  type="date"
                  name="harvest_date"
                  value={formData.harvest_date}
                  onChange={handleFormChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Province *
                </label>
                <select
                  name="province"
                  value={formData.province}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  required
                >
                  <option value="">Select a province</option>
                  {PROVINCES.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  City
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  disabled={!formData.province}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: !formData.province ? '#f5f5f5' : 'white',
                    cursor: !formData.province ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">Select a city</option>
                  {selectedCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Village
                </label>
                <select
                  name="village"
                  value={formData.village}
                  onChange={handleFormChange}
                  disabled={!formData.city}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: !formData.city ? '#f5f5f5' : 'white',
                    cursor: !formData.city ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">Select a village</option>
                  {selectedVillages.map(village => (
                    <option key={village} value={village}>{village}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Field Location
                </label>
                <input
                  type="text"
                  name="field_location"
                  value={formData.field_location}
                  onChange={handleFormChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Describe the field location"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Farmer Name *
                </label>
                <input
                  type="text"
                  name="farmer_name"
                  value={formData.farmer_name}
                  onChange={handleFormChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter farmer name"
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    background: '#ddd',
                    color: '#333',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    background: submitting ? '#ccc' : '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {submitting ? 'Saving...' : 'Save Crop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crops Grid Display */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {crops.map((c) => (
          <div key={c.id || c._id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '16px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            {c.crop_image_path && (
              <img src={getImageUrl(c.crop_image_path)} alt={c.crop_name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }} />
            )}
            <h3 style={{ margin: '10px 0 5px 0' }}>{c.crop_name}</h3>
            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
              <strong>Type:</strong> {c.crop_type}
            </p>
            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
              <strong>Farmer:</strong> {c.farmer_name || 'N/A'}
            </p>
            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
              <strong>Location:</strong> {c.field_location || 'N/A'}
            </p>
            <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
              <strong>Province:</strong> {c.province || 'N/A'}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <button 
                  style={{ flex:1, padding:'8px', background:'#e3f2fd', color:'#1565c0', border:'1px solid #90caf9', borderRadius:'6px', cursor:'pointer' }}
                  onClick={() => alert(`View details for ${c.crop_name} (Implement modal here)`)}>
                  📋 View
                </button>
                <button 
                  style={{ flex:1, padding:'8px', background:'#fff8e1', color:'#e65100', border:'1px solid #ffe082', borderRadius:'6px', cursor:'pointer' }}
                  onClick={() => alert(`Edit crop ${c.crop_name} (Implement modal here)`)}>
                  ✍️ Update
                </button>
                <button 
                  style={{ flex:1, padding:'8px', background:'#ffebee', color:'#c62828', border:'1px solid #ef9a9a', borderRadius:'6px', cursor:'pointer' }}
                  onClick={() => handleDelete(c.id || c._id)}>
                  🗑️ Delete
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
