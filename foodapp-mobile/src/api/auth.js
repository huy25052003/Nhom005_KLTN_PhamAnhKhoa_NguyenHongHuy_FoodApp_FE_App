import axios from './axios';

export const login = async (username, password) => {
  const res = await axios.post('auth/login', { username, password });
  return handleTokenResponse(res);
};

export const register = async (username, password) => {
  const res = await axios.post('auth/register', { username, password });
  return handleTokenResponse(res);
};

export const loginWithFirebase = async (firebaseToken) => {
  const res = await axios.post('auth/firebase', { token: firebaseToken });
  return handleTokenResponse(res);
};

export const requestForgotPassword = async (email) => {
  const res = await axios.post('auth/forgot-password/request', { email });
  return res.data;
};

export const resetPasswordEmail = async (email, code, newPassword) => {
  const res = await axios.post('auth/forgot-password/reset', { email, code, newPassword });
  return res.data;
};

export const resetPasswordPhone = async (firebaseToken, newPassword) => {
  const res = await axios.post('auth/forgot-password/phone', { token: firebaseToken, newPassword });
  return res.data;
};

export const changePassword = async (oldPassword, newPassword) => {
  const res = await axios.post('auth/change-password', { oldPassword, newPassword });
  return res.data;
};

function handleTokenResponse(res) {
  const token =
    res.data?.accessToken || 
    res.data?.token || 
    res.data?.access_token || 
    res.data?.jwt ||
    (() => {
      const h = res.headers?.authorization || res.headers?.Authorization;
      return h && /^Bearer\s+/i.test(h) ? h.replace(/^Bearer\s+/i, "") : null;
    })();

  if (!token) return { accessToken: null, token: null };
  return { accessToken: token, token };
}
