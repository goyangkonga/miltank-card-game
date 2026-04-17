const API = (() => {
  const BASE = window.location.origin;

  function token() { return localStorage.getItem('token') || ''; }

  async function req(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || JSON.stringify(data));
    return data;
  }

  return {
    post: (p, b) => req('POST', p, b),
    get:  (p)    => req('GET',  p),
    del:  (p)    => req('DELETE', p),
    isLoggedIn: () => !!token(),
    logout: () => { localStorage.clear(); location.href = '/'; },
    saveSession: (data) => {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('nickname', data.nickname);
      localStorage.setItem('is_new_user', data.is_new_user);
      localStorage.setItem('milk', data.milk);
    },
    nickname: () => localStorage.getItem('nickname') || '',
    isNewUser: () => localStorage.getItem('is_new_user') === '1',
  };
})();
