import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'ttgl37tt') {
      localStorage.setItem('admin_auth', 'true');
      onSuccess();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-tiffany/10 text-tiffany rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">管理者ログイン</h2>
        <p className="text-gray-500 mb-8">アクセスパスワードを入力してください</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6 text-left">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="パスワード"
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-tiffany/50 transition-colors ${
                error ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {error && <p className="text-red-500 text-sm mt-2">パスワードが正しくありません</p>}
          </div>
          <button
            type="submit"
            disabled={!password}
            className="w-full bg-tiffany text-white font-bold py-3 rounded-xl hover:bg-tiffany-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
