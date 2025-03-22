import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';

function EditTour() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    price: '',
    duration: '',
    date: ''
  });

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5001/api/tours/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const tour = response.data;
        setFormData({
          name: tour.name,
          description: tour.description,
          location: tour.location,
          price: tour.price,
          duration: tour.duration,
          date: tour.date.split('T')[0]
        });
        setLoading(false);
      } catch (error) {
        enqueueSnackbar('Error fetching tour details', { variant: 'error' });
        navigate('/admin/manage-tour');
      }
    };

    fetchTour();
  }, [id, navigate, enqueueSnackbar]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formDataWithImage = new FormData();
      
      Object.keys(formData).forEach(key => {
        formDataWithImage.append(key, formData[key]);
      });
      
      if (image) {
        formDataWithImage.append('image', image);
      }

      await axios.put(`http://localhost:5001/api/tours/${id}`, formDataWithImage, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      enqueueSnackbar('Tour updated successfully', { variant: 'success' });
      navigate('/admin/manage-tour');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update tour';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Edit Tour</h1>
        <form onSubmit={handleSubmit} className="max-w-2xl bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Tour Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows="4"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2">Price ($)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Duration (days)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                min="1"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Update Image (optional)</label>
            <input
              type="file"
              onChange={handleImageChange}
              className="w-full p-2 border rounded"
              accept="image/*"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/manage-tour')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Tour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTour;
