// frontend/src/pages/dashboard/components/SettingsPage.jsx
import { useContext, useState } from 'react';
import { Bell, Monitor, ShieldAlert, Trash2, KeyRound } from 'lucide-react';
import { AppContent } from '../../../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

const Toggle = ({ checked, onChange, id }) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative inline-flex w-10 h-6 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
      checked ? 'bg-blue-600' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 mt-1 ${
        checked ? 'translate-x-5' : 'translate-x-1'
      }`}
    />
  </button>
);

const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
      <Icon size={15} className="text-gray-500" />
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
    </div>
    <div className="px-5 py-4 space-y-4">{children}</div>
  </div>
);

const SettingRow = ({ label, description, checked, onChange, id }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <label htmlFor={id} className="text-sm font-medium text-gray-800 cursor-pointer">{label}</label>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
    <Toggle checked={checked} onChange={onChange} id={id} />
  </div>
);

const SettingsPage = () => {
  const { logout } = useContext(AppContent);
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    emailNotifications: true,
    browserNotifications: false,
    examReminders: true,
    darkMode: false,
    highContrast: false,
    compactView: false,
  });

  const toggle = (key) =>
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="p-4 w-full max-w-full space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Settings</h2>
        <p className="text-sm text-gray-400 mt-0.5">Manage your preferences and account</p>
      </div>

      <Section icon={Bell} title="Notifications">
        <SettingRow
          id="emailNotif"
          label="Email Notifications"
          description="Receive exam results and announcements via email"
          checked={settings.emailNotifications}
          onChange={() => toggle('emailNotifications')}
        />
        <SettingRow
          id="browserNotif"
          label="Browser Notifications"
          description="Get in-app alerts when something needs your attention"
          checked={settings.browserNotifications}
          onChange={() => toggle('browserNotifications')}
        />
        <SettingRow
          id="examReminders"
          label="Exam Reminders"
          description="Get reminded before an upcoming exam starts"
          checked={settings.examReminders}
          onChange={() => toggle('examReminders')}
        />
      </Section>

      <Section icon={Monitor} title="Appearance">
        <SettingRow
          id="darkMode"
          label="Dark Mode"
          description="Switch to a darker interface"
          checked={settings.darkMode}
          onChange={() => toggle('darkMode')}
        />
        <SettingRow
          id="highContrast"
          label="High Contrast"
          description="Increase contrast for better accessibility"
          checked={settings.highContrast}
          onChange={() => toggle('highContrast')}
        />
        <SettingRow
          id="compactView"
          label="Compact View"
          description="Reduce spacing for a denser layout"
          checked={settings.compactView}
          onChange={() => toggle('compactView')}
        />
      </Section>

      <Section icon={ShieldAlert} title="Security & Account">
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/reset-password')}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition w-fit cursor-pointer"
          >
            <KeyRound size={14} /> Change Password
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                // TODO: wire to DELETE /api/user/me endpoint
                logout();
              }
            }}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition w-fit cursor-pointer"
          >
            <Trash2 size={14} /> Delete Account
          </button>
        </div>
      </Section>
    </div>
  );
};

export default SettingsPage;