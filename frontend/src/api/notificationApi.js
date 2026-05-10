import api from './api';

export const getNotifications = async () => {
  return api.get('/notifications');
};

export const markNotificationRead = async (id) => {
  return api.put(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async () => {
  return api.put('/notifications/read-all');
};
