// pages/dashboard/StudentProfile.jsx
import { useContext, useState } from 'react';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';

const StudentProfile = () => {
  const { authState: { userData }, backendUrl } = useContext(AppContent);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    email: userData?.email || ''
  });

  const handleUpdate = async () => {
    try {
      await axios.patch(`${backendUrl}/api/user/profile`, formData, {
        withCredentials: true
      });
      setEditMode(false);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">My Profile</h2>
        <button 
          onClick={() => setEditMode(!editMode)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {editMode ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          {editMode ? (
            <div className="flex gap-2">
              <input
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="p-2 border rounded w-full"
              />
              <input
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="p-2 border rounded w-full"
              />
            </div>
          ) : (
            <p className="p-2 bg-gray-50 rounded">{userData?.firstName} {userData?.lastName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          {editMode ? (
            <input
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="p-2 border rounded w-full"
            />
          ) : (
            <p className="p-2 bg-gray-50 rounded">{userData?.email}</p>
          )}
        </div>

        {editMode && (
          <button 
            onClick={handleUpdate}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Save Changes
          </button>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;