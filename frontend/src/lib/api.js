import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
});

export async function fetchLocations(bounds, type) {
  const params = {};
  if (bounds) params.bounds = JSON.stringify(bounds);
  if (type) params.type = type;
  const { data } = await api.get('/api/locations', { params });
  return data;
}

export async function createLocation(locationData) {
  const { data } = await api.post('/api/locations', locationData);
  return data;
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await api.post('/api/locations/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function fetchLocationById(id) {
  const { data } = await api.get(`/api/locations/${id}`);
  return data;
}

export default api;
