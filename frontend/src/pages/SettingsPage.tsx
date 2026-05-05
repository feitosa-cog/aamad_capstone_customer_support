import React, { useState } from 'react';
import Header from '../components/Common/Header';
import { Bell, Lock, Palette, Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    chatNotifications: true,
    escalationAlerts: true,
  });

  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    ticketsPerPage: 20,
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePreferenceChange = (key: keyof typeof preferences, value: any) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header title="Settings" />

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Notifications Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell size={24} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Email Alerts</p>
                  <p className="text-sm text-gray-600">Receive email notifications for important events</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailAlerts}
                  onChange={() => handleToggle('emailAlerts')}
                  className="w-5 h-5 rounded text-blue-600"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Chat Notifications</p>
                  <p className="text-sm text-gray-600">Get notified of new chat messages</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.chatNotifications}
                  onChange={() => handleToggle('chatNotifications')}
                  className="w-5 h-5 rounded text-blue-600"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Escalation Alerts</p>
                  <p className="text-sm text-gray-600">Alert on ticket escalations</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.escalationAlerts}
                  onChange={() => handleToggle('escalationAlerts')}
                  className="w-5 h-5 rounded text-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Palette size={24} className="text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Theme</label>
                <select
                  value={preferences.theme}
                  onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Language</label>
                <select
                  value={preferences.language}
                  onChange={(e) => handlePreferenceChange('language', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Tickets Per Page
                </label>
                <select
                  value={preferences.ticketsPerPage}
                  onChange={(e) => handlePreferenceChange('ticketsPerPage', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock size={24} className="text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">Security</h2>
            </div>

            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-medium">
                Change Password
              </button>
              <button className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-medium">
                Two-Factor Authentication
              </button>
              <button className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-medium">
                Active Sessions
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <Save size={18} />
              Save Changes
            </button>
            <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
