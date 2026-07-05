import axios from "axios";

axios.defaults.withCredentials = true;

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL;

export const notificationService = {
  async getNotifications({ page = 1, limit = 10 } = {}) {
    const { data } = await axios.get(
      `${getBackendUrl()}/api/notifications?page=${page}&limit=${limit}`
    );
    return data;
  },

  async getNotificationById(id) {
    const { data } = await axios.get(`${getBackendUrl()}/api/notifications/${id}`);
    return data;
  },

  async createNotification(formData) {
    const { data } = await axios.post(
      `${getBackendUrl()}/api/notifications`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  },

  async updateNotification(id, formData) {
    const { data } = await axios.put(
      `${getBackendUrl()}/api/notifications/${id}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  },

  async deleteNotification(id) {
    const { data } = await axios.delete(`${getBackendUrl()}/api/notifications/${id}`);
    return data;
  },

  async archiveNotification(id) {
    const { data } = await axios.patch(`${getBackendUrl()}/api/notifications/${id}/archive`);
    return data;
  },

  async publishNotification(id) {
    const { data } = await axios.patch(`${getBackendUrl()}/api/notifications/${id}/publish`);
    return data;
  },

  async pinNotification(id) {
    const { data } = await axios.patch(`${getBackendUrl()}/api/notifications/${id}/pin`);
    return data;
  },

  async unpinNotification(id) {
    const { data } = await axios.patch(`${getBackendUrl()}/api/notifications/${id}/unpin`);
    return data;
  },

  async reactToNotification(id, type) {
    const { data } = await axios.post(`${getBackendUrl()}/api/notifications/${id}/reactions`, {
      type,
    });
    return data;
  },

  async removeReaction(id) {
    const { data } = await axios.delete(`${getBackendUrl()}/api/notifications/${id}/reactions`);
    return data;
  },

  async addComment(id, text) {
    const { data } = await axios.post(`${getBackendUrl()}/api/notifications/${id}/comments`, {
      text,
    });
    return data;
  },

  async updateComment(id, commentId, text) {
    const { data } = await axios.put(
      `${getBackendUrl()}/api/notifications/${id}/comments/${commentId}`,
      { text }
    );
    return data;
  },

  async deleteComment(id, commentId) {
    const { data } = await axios.delete(
      `${getBackendUrl()}/api/notifications/${id}/comments/${commentId}`
    );
    return data;
  },
};