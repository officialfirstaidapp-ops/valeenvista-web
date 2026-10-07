import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  MapPin, 
  Bed, 
  Bath, 
  Square,
  Upload,
  X,
  Plus,
  Loader,
  CheckCircle,
  Trash2
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import PesoIcon from '../components/PesoIcon';
import { propertyAPI } from '../services/api';

const AddProperty = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    type: 'house',
    status: 'available',
    features: []
  });

  const [featureInput, setFeatureInput] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = [...imageFiles, ...files];
    if (newFiles.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }
    setImageFiles(newFiles);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.title.trim()) { setError('Title is required'); return; }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) { setError('Price must be a positive number'); return; }

    if (!formData.location.trim()) { setError('Location is required'); return; }
    if (!formData.description.trim()) { setError('Description is required'); return; }

    const bedrooms = formData.bedrooms ? parseInt(formData.bedrooms) : 0;
    const bathrooms = formData.bathrooms ? parseInt(formData.bathrooms) : 0;

    if (bedrooms < 0) { setError('Bedrooms cannot be negative'); return; }
    if (bathrooms < 0) { setError('Bathrooms cannot be negative'); return; }
    if (imageFiles.length === 0) { setError('Please upload at least 1 image'); return; }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('price', priceNum.toString());
      submitData.append('location', formData.location.trim());
      submitData.append('bedrooms', bedrooms.toString());
      submitData.append('bathrooms', bathrooms.toString());
      submitData.append('area', formData.area || '');
      submitData.append('type', formData.type);
      submitData.append('status', formData.status);
      submitData.append('features', JSON.stringify(formData.features));
      
      imageFiles.forEach(file => { submitData.append('images', file); });

      await propertyAPI.createWithImages(submitData);
      setSuccess(true);
      
      setTimeout(() => {
        if (user?.role === 'admin') navigate('/admin/properties');
        else if (user?.role === 'broker') navigate('/broker/properties');
        else if (user?.role === 'agent') navigate('/agent/properties');
        else navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Error creating property:', err);
      setError(err.response?.data?.error || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  const propertyTypes = [
    { value: 'house', label: 'House' },
    { value: 'condo', label: 'Condo' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'lot', label: 'Lot' }
  ];

  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'pending', label: 'Pending' },
    { value: 'sold', label: 'Sold' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole={user?.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-soft-green to-warm-orange rounded-lg shadow-lg p-6 mb-6 text-white">
              <h1 className="text-3xl font-bold">Add New Property</h1>
              <p className="text-white/80 mt-1">Fill in the details to list a new property</p>
            </div>

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                <CheckCircle size={20} />
                Property created successfully! Redirecting...
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 border border-pastel-green">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-dark-text mb-4 pb-2 border-b border-pastel-green">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-dark-text text-sm font-bold mb-2">Property Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                      placeholder="e.g., Luxury Condo in BGC"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-dark-text text-sm font-bold mb-2">Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="4"
                      className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                      placeholder="Describe the property..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-dark-text text-sm font-bold mb-2">Price (₱) *</label>
                    <div className="relative">
                      <PesoIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text" />
                      <input
                        type="number"
                        name="price"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                        placeholder="e.g., 12500000"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-dark-text text-sm font-bold mb-2">Location *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text" size={18} />
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green"
                        placeholder="e.g., BGC, Taguig"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-dark-text mb-4 pb-2 border-b border-pastel-green">Property Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-dark-text text-sm font-bold mb-2"><Bed size={16} className="inline mr-1" />Bedrooms</label>
                    <input type="number" name="bedrooms" min="0" value={formData.bedrooms} onChange={handleChange} className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-dark-text text-sm font-bold mb-2"><Bath size={16} className="inline mr-1" />Bathrooms</label>
                    <input type="number" name="bathrooms" min="0" value={formData.bathrooms} onChange={handleChange} className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-dark-text text-sm font-bold mb-2"><Square size={16} className="inline mr-1" />Area (sqm)</label>
                    <input type="text" name="area" value={formData.area} onChange={handleChange} className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green" placeholder="e.g., 85 sqm" />
                  </div>
                  <div>
                    <label className="block text-dark-text text-sm font-bold mb-2">Property Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green">
                      {propertyTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-dark-text text-sm font-bold mb-2">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green">
                      {statusOptions.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-dark-text mb-4 pb-2 border-b border-pastel-green">Property Images</h2>
                <div className="mb-4">
                  <label className="block text-dark-text text-sm font-bold mb-2">Upload Images (Max 10) *</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-pastel-green rounded-lg cursor-pointer hover:bg-pastel-green hover:bg-opacity-20 transition">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="text-soft-green mb-2" size={32} />
                        <p className="mb-2 text-sm text-dark-text"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-light-text">PNG, JPG, GIF, WEBP (Max 5MB each)</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageSelect} />
                    </label>
                  </div>
                </div>
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                        <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-light-text mt-2">{imageFiles.length} / 10 images selected</p>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-dark-text mb-4 pb-2 border-b border-pastel-green">Features & Amenities</h2>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} className="flex-1 px-4 py-2 border border-pastel-green rounded-lg focus:outline-none focus:border-soft-green" placeholder="e.g., Swimming Pool" onKeyPress={(e) => e.key === 'Enter' && addFeature()} />
                  <button type="button" onClick={addFeature} className="px-4 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition"><Plus size={18} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, index) => (
                    <span key={index} className="bg-pastel-green text-dark-text px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      {feature}
                      <button type="button" onClick={() => removeFeature(index)} className="text-dark-text hover:text-red-500 transition"><X size={14} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 text-dark-text hover:bg-pastel-orange rounded-lg transition">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition flex items-center gap-2 disabled:opacity-50">
                  {loading ? <Loader className="animate-spin" size={18} /> : <Home size={18} />}
                  {loading ? 'Creating...' : 'Create Property'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddProperty;