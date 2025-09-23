import { API_BASE_URL } from "@/services/api";

// Get all users
export const getUsers = async (token) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

// Get user by id
export const getUserById = async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

// Login user
export const loginUser = async (user) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer login');
    }
    return data;
};

// Create user
export const createUser = async (user) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Erro ao registrar usuário');
    }

    return data;
};

// Update user
export const updateUser = async (id, user, token) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(user),
    });
    return response.json();
};

// Delete user
export const deleteUser = async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};