// UserProfile.jsx — available to ALL roles (each user edits their own profile)
// Updated UX:
// 1) Save button stays disabled until user actually changes something valid
// 2) On save, local visible profile updates immediately without reload

import { useContext, useState, useEffect, useMemo } from 'react';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { UserCircle2, Pencil, X, Check, ShieldCheck, BookOpen, GraduationCap } from 'lucide-react';

const roleMeta = {
  Admin:   { label: 'Administrator',  cls: 'bg-purple-100 text-purple-700', Icon: ShieldCheck },
  Faculty: { label: 'Faculty Member', cls: 'bg-blue-100 text-blue-700',   Icon: BookOpen },
  Student: { label: 'Student',        cls: 'bg-green-100 text-green-700',  Icon: GraduationCap },
};

const UserProfile = () => {
  const { authState: { userData }, setUserData, backendUrl } = useContext(AppContent);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '' });
  const [displayUser, setDisplayUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (userData) {
      setDisplayUser(userData);
      setForm({ firstName: userData.firstName || '', lastName: userData.lastName || '' });
    }
  }, [userData]);

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required.';
    if (!form.lastName.trim()) e.lastName = 'Last name is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const hasChanges = useMemo(() => {
    if (!displayUser) return false;
    return (
      form.firstName.trim() !== (displayUser.firstName || '').trim() ||
      form.lastName.trim() !== (displayUser.lastName || '').trim()
    );
  }, [form, displayUser]);

  const isFormValid = form.firstName.trim() && form.lastName.trim();
  const canSave = editMode && hasChanges && isFormValid && !saving;

  const handleSave = async () => {
    if (!validate() || !hasChanges) return;
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      };

      const { data } = await axios.patch(
        `${backendUrl}/api/user/profile`,
        payload,
        { withCredentials: true }
      );

      if (data.success) {
        const updatedUser = {
          ...(displayUser || {}),
          firstName: payload.firstName,
          lastName: payload.lastName,
          ...(data.userData || {}),
        };

        setDisplayUser(updatedUser);
        setForm({ firstName: updatedUser.firstName || '', lastName: updatedUser.lastName || '' });

        if (setUserData) {
          setUserData(prev => ({
            ...(prev || {}),
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
          }));
        }

        toast.success('Profile updated successfully.');
        setEditMode(false);
        setErrors({});
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      firstName: displayUser?.firstName || '',
      lastName: displayUser?.lastName || '',
    });
    setErrors({});
    setEditMode(false);
  };

  if (!displayUser) {
    return <div className="p-4 text-sm text-gray-400">Loading profile…</div>;
  }

  const { label: roleLabel, cls: roleCls, Icon: RoleIcon } = roleMeta[displayUser.role] || roleMeta.Student;

  return (
    <div className="p-4 w-full max-w-full">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800">My Profile</h2>
        <p className="text-sm text-gray-400 mt-0.5">View and update your personal details</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-5 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
            <UserCircle2 size={36} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-base">
              {displayUser.firstName} {displayUser.lastName}
            </p>
            <p className="text-xs text-gray-400">{displayUser.email}</p>
            <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleCls}`}>
              <RoleIcon size={11} /> {roleLabel}
            </span>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">First Name</label>
            {editMode ? (
              <>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                  className={`w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.firstName && <p className="text-xs text-red-500 mt-0.5">{errors.firstName}</p>}
              </>
            ) : (
              <p className="text-sm text-gray-800 font-medium">{displayUser.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Last Name</label>
            {editMode ? (
              <>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                  className={`w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.lastName ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.lastName && <p className="text-xs text-red-500 mt-0.5">{errors.lastName}</p>}
              </>
            ) : (
              <p className="text-sm text-gray-800 font-medium">{displayUser.lastName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Email Address</label>
            <p className="text-sm text-gray-500">{displayUser.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">Email cannot be changed. Contact an admin if needed.</p>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Role</label>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleCls}`}>
              <RoleIcon size={11} /> {roleLabel}
            </span>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Email Verification</label>
            {displayUser.isAccountVerified
              ? <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">✓ Verified</span>
              : <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">⚠ Not verified — check your dashboard banner</span>}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
          {editMode ? (
            <>
              <button onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-100 transition cursor-pointer">
                <X size={12} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md transition ${
                  canSave
                    ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                    : 'bg-blue-300 text-white cursor-not-allowed opacity-60'
                }`}
              >
                <Check size={12} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-800 text-white rounded-md hover:bg-gray-700 transition cursor-pointer">
              <Pencil size={12} /> Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;