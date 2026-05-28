import * as SecureStore from 'expo-secure-store';

// DEVELOPER TIP:
// For Expo Web / iOS Simulator: use localhost (http://localhost:5000)
// For Physical Android/iOS Device (Expo Go QR Code): use your computer's local LAN IP (e.g., http://192.168.10.5:5000)
const DEFAULT_API_URL = 'http://192.168.100.9:5000';

let API_URL = DEFAULT_API_URL;

export const setCustomApiUrl = (url) => {
  API_URL = url;
};

export const getApiUrl = () => API_URL;

// Helper to compile request headers with auth token
async function getHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    const token = await SecureStore.getItemAsync('rideease_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn("Failed to retrieve auth token from SecureStore", err);
  }

  return headers;
}

export const api = {
  // Authentication
  auth: {
    login: async (email, password) => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await response.json();
    },

    register: async (name, email, phone, password) => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });
      return await response.json();
    },

    getProfile: async () => {
      const headers = await getHeaders();
      const response = await fetch(`${API_URL}/api/auth/profile`, { headers });
      return await response.json();
    },

    uploadDocs: async (cnicData, licenseData) => {
      const headers = await getHeaders();
      const response = await fetch(`${API_URL}/api/auth/upload-docs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ cnicData, licenseData })
      });
      return await response.json();
    }
  },

  // Vehicles Fleet
  vehicles: {
    list: async (type = '') => {
      const url = type ? `${API_URL}/api/vehicles?type=${type}` : `${API_URL}/api/vehicles`;
      const response = await fetch(url);
      return await response.json();
    },

    get: async (id) => {
      const response = await fetch(`${API_URL}/api/vehicles/${id}`);
      return await response.json();
    }
  },

  // Bookings
  bookings: {
    create: async (bookingData) => {
      const headers = await getHeaders();
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bookingData)
      });
      return await response.json();
    },

    history: async () => {
      const headers = await getHeaders();
      const response = await fetch(`${API_URL}/api/bookings/history`, { headers });
      return await response.json();
    },

    cancel: async (id) => {
      const headers = await getHeaders();
      const response = await fetch(`${API_URL}/api/bookings/${id}/cancel`, {
        method: 'POST',
        headers
      });
      return await response.json();
    },

    complete: async (id) => {
      const headers = await getHeaders();
      const response = await fetch(`${API_URL}/api/bookings/${id}/complete`, {
        method: 'POST',
        headers
      });
      return await response.json();
    }
  },

  // Digital Wallet
  wallet: {
    get: async () => {
      const headers = await getHeaders();
      const response = await fetch(`${API_URL}/api/wallet`, { headers });
      return await response.json();
    },

    topUp: async (amount) => {
      const headers = await getHeaders();
      const response = await fetch(`${API_URL}/api/wallet/top-up`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount })
      });
      return await response.json();
    }
  },

  // AI Vehicle Recommendation
  ai: {
    recommend: async (tripMetrics) => {
      const headers = await getHeaders();
      const response = await fetch(`${API_URL}/api/ai/recommend`, {
        method: 'POST',
        headers,
        body: JSON.stringify(tripMetrics)
      });
      return await response.json();
    },
    chat: async (chatPayload) => {
      const headers = await getHeaders();
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(chatPayload)
      });
      return await response.json();
    }
  },

  // Damage Incidents Log
  damage: {
    report: async (bookingId, description, photos = []) => {
      const headers = await getHeaders();
      const response = await fetch(`${API_URL}/api/damage`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ bookingId, description, photos })
      });
      return await response.json();
    }
  }
};
