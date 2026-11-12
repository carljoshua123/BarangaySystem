import React, { useState } from 'react';
import { api } from '../api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      onLoginSuccess(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Welcome Back</h2>
      {error && <div className="alert alert-danger py-2 text-sm">{error}</div>}
      
      <div>
        <label className="block text-sm font-semibold mb-1 text-gray-700">Email Address</label>
        <input 
          type="email" 
          className="form-control p-2.5 rounded-lg border border-gray-300 w-full focus:ring-2 focus:ring-blue-500" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1 text-gray-700">Password</label>
        <input 
          type="password" 
          className="form-control p-2.5 rounded-lg border border-gray-300 w-full focus:ring-2 focus:ring-blue-500" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="btn btn-primary w-full py-2.5 font-bold shadow-md bg-blue-600 hover:bg-blue-700 border-none transition"
      >
        {loading ? 'Authenticating...' : 'Sign In'}
      </button>
    </form>
  );
}