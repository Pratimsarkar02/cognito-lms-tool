// pages/dashboard/SettingsPage.jsx
import { useState } from 'react';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    browserNotifications: false,
    darkMode: false,
    highContrast: false
  });

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6">Account Settings</h2>

      <div className="space-y-6 max-w-xl">
        {/* Notifications Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Notifications</h3>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
            />
            <label>Email Notifications</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.browserNotifications}
              onChange={() => handleToggle('browserNotifications')}
            />
            <label>Browser Notifications</label>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Appearance</h3>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={() => handleToggle('darkMode')}
            />
            <label>Dark Mode</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={() => handleToggle('highContrast')}
            />
            <label>High Contrast Mode</label>
          </div>
        </div>

        {/* Security Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Security</h3>
          <button className="text-blue-600 hover:underline">
            Change Password
          </button>
          <button className="text-red-600 hover:underline">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;