import api from "./api";

export const applyLeave = async (data, token) => {
  const res = await api.post("/leaves", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getMyLeaves = async (token) => {
  const res = await api.get("/leaves/my", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getAssignedLeaves = async (token) => {
  const res = await api.get("/leaves/assigned", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const approveLeave = async (id, token) => {
  await api.put(`/leaves/${id}/approve`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const rejectLeave = async (id, token) => {
  await api.put(`/leaves/${id}/reject`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
