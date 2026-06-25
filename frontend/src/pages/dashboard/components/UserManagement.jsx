// UserManagement.jsx — Admin only
// Updated UX:
// - Table shows role as text/badge only
// - Role can be changed only inside the user details modal

import { useState, useContext, useEffect, useCallback } from 'react';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Search, Trash2, ChevronLeft, ChevronRight, ShieldCheck, GraduationCap, BookOpen, X, UserCircle2 } from 'lucide-react';

const ROLES = ['All', 'Student', 'Faculty', 'Admin'];

const roleIcon = (role) => {
  if (role === 'Admin') return <ShieldCheck size={13} className="inline mr-1 text-purple-600" />;
  if (role === 'Faculty') return <BookOpen size={13} className="inline mr-1 text-blue-600" />;
  return <GraduationCap size={13} className="inline mr-1 text-green-600" />;
};

const roleBadge = (role) => {
  const cls = {
    Admin: 'bg-purple-100 text-purple-700',
    Faculty: 'bg-blue-100 text-blue-700',
    Student: 'bg-green-100 text-green-700',
  }[role] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {roleIcon(role)}{role}
    </span>
  );
};

const verifiedBadge = (v) => v
  ? <span className="px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700">✓ Verified</span>
  : <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-50 text-yellow-700">⚠ Unverified</span>;

const UserDetailModal = ({ userId, onClose, onRoleChange, onDelete, currentAdminId }) => {
  const { backendUrl } = useContext(AppContent);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleVal, setRoleVal] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/user/${userId}`, { withCredentials: true });
        if (data.success) {
          setUser(data.user);
          setRoleVal(data.user.role);
        } else {
          toast.error(data.message);
        }
      } catch {
        toast.error('Failed to load user details');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, backendUrl]);

  const handleRoleSave = async () => {
    if (!user || roleVal === user.role) return onClose();
    setSaving(true);
    try {
      const { data } = await axios.patch(
        `${backendUrl}/api/user/${userId}/role`,
        { role: roleVal },
        { withCredentials: true }
      );
      if (data.success) {
        toast.success(data.message);
        onRoleChange(userId, roleVal);
        onClose();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!window.confirm(`Delete ${user.firstName} ${user.lastName}? This cannot be undone.`)) return;
    try {
      const { data } = await axios.delete(`${backendUrl}/api/user/${userId}`, { withCredentials: true });
      if (data.success) {
        toast.success(data.message);
        onDelete(userId);
        onClose();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const isSelf = user && userId === currentAdminId;
  const canSaveRole = user && !isSelf && roleVal && roleVal !== user.role && !saving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-base">User Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition cursor-pointer"><X size={18} /></button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : !user ? (
          <div className="p-8 text-center text-red-500 text-sm">Could not load user data.</div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <UserCircle2 size={32} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-1">Current Role</p>
                {roleBadge(user.role)}
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Email Status</p>
                {verifiedBadge(user.isAccountVerified)}
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-1">User ID</p>
                <p className="text-xs text-gray-500 font-mono break-all">{user._id}</p>
              </div>
            </div>

            {!isSelf ? (
              <div>
                <label className="text-xs text-gray-400 block mb-1">Change Role</label>
                <select
                  value={roleVal}
                  onChange={e => setRoleVal(e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {['Student', 'Faculty', 'Admin'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-xs text-yellow-600 bg-yellow-50 rounded px-3 py-2">
                You cannot modify your own account from here.
              </p>
            )}
          </div>
        )}

        {user && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
            {!isSelf ? (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition cursor-pointer"
              >
                <Trash2 size={13} /> Delete User
              </button>
            ) : <span />}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              {!isSelf && (
                <button
                  onClick={handleRoleSave}
                  disabled={!canSaveRole}
                  className={`px-3 py-1.5 text-xs rounded-md transition ${
                    canSaveRole
                      ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                      : 'bg-blue-300 text-white cursor-not-allowed opacity-60'
                  }`}
                >
                  {saving ? 'Saving…' : 'Save Role'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const UserManagement = () => {
  const { backendUrl, authState: { userData } } = useContext(AppContent);
  const currentAdminId = userData?._id?.toString();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);

  const LIMIT = 15;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, roleFilter]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: LIMIT,
        ...(roleFilter !== 'All' && { role: roleFilter }),
        ...(debouncedSearch && { search: debouncedSearch }),
      });

      const { data } = await axios.get(`${backendUrl}/api/user/all?${params}`, { withCredentials: true });
      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [backendUrl, page, roleFilter, debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = (userId, newRole) => {
    setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
  };

  const handleDelete = (userId) => {
    setUsers(prev => prev.filter(u => u._id !== userId));
    setPagination(prev => ({ ...prev, total: Math.max((prev.total || 1) - 1, 0) }));
  };

  const totalPages = pagination.totalPages || 1;

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">User Management</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          {pagination.total !== undefined ? `${pagination.total} total users` : 'Manage all registered users'}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs">
          {ROLES.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 transition cursor-pointer ${roleFilter === r ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">
                  No users found{search ? ` for "${search}"` : ''}.
                </td>
              </tr>
            ) : (
              users.map(user => {
                const isSelf = user._id?.toString() === currentAdminId;
                return (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => setSelectedUserId(user._id)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                      {isSelf && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{user.email}</td>
                    <td className="px-4 py-3">{roleBadge(user.role)}</td>
                    <td className="px-4 py-3">{verifiedBadge(user.isAccountVerified)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {!isSelf && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ${user.firstName} ${user.lastName}?`)) {
                              axios.delete(`${backendUrl}/api/user/${user._id}`, { withCredentials: true })
                                .then(({ data }) => {
                                  if (data.success) {
                                    toast.success(data.message);
                                    handleDelete(user._id);
                                  } else {
                                    toast.error(data.message);
                                  }
                                })
                                .catch(() => toast.error('Delete failed'));
                            }
                          }}
                          className="text-red-400 hover:text-red-600 transition cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-red-400 rounded"
                          title="Delete user"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, pagination.total)} of {pagination.total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 py-1 text-xs">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onRoleChange={handleRoleChange}
          onDelete={handleDelete}
          currentAdminId={currentAdminId}
        />
      )}
    </div>
  );
};

export default UserManagement;