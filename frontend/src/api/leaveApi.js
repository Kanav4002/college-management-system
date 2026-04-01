const BASE_URL = "http://localhost:8080/api/leaves";

export const applyLeave = async (data, token) => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to apply leave");

  return res.json();
};

export const getMyLeaves = async (token) => {
  const res = await fetch(`${BASE_URL}/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

export const getAssignedLeaves = async (token) => {
  const res = await fetch(`${BASE_URL}/assigned`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

export const approveLeave = async (id, token) => {
  await fetch(`${BASE_URL}/${id}/approve`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const rejectLeave = async (id, token) => {
  await fetch(`${BASE_URL}/${id}/reject`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
};