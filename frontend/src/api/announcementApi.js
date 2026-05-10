import api from './api';

export const getAnnouncements = async (params = {}) => {
  return api.get('/announcements', { params });
};

export const getAnnouncementById = async (id) => {
  return api.get(`/announcements/${id}`);
};

export const createAnnouncement = async (data) => {
  return api.post('/announcements', data);
};

export const updateAnnouncement = async (id, data) => {
  return api.put(`/announcements/${id}`, data);
};

export const deleteAnnouncement = async (id) => {
  return api.delete(`/announcements/${id}`);
};
