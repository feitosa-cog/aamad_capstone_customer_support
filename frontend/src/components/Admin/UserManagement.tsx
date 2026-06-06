import React, { useEffect, useState } from 'react';
import { getUsers, updateUserRole, type AdminRole, type AdminUser } from '../../api/adminApi';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await getUsers();
        setUsers(response);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, role: AdminRole) => {
    setSavingUserId(userId);
    try {
      const updated = await updateUserRole(userId, role);
      setUsers((prev) => prev.map((user) => (user.id === userId ? updated : user)));
    } catch (error) {
      console.error('Failed to update user role:', error);
    } finally {
      setSavingUserId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Loading users...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">User Management</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100">
                <td className="py-3 pr-4 text-gray-900">{user.name}</td>
                <td className="py-3 pr-4 text-gray-700">{user.email}</td>
                <td className="py-3 pr-4">
                  <select
                    value={user.role}
                    disabled={savingUserId === user.id}
                    onChange={(event) => handleRoleChange(user.id, event.target.value as AdminRole)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md"
                  >
                    <option value="REQUESTOR">Requestor</option>
                    <option value="REAL_AGENT">Real Agent</option>
                    <option value="PLATFORM_ADMIN">Platform Admin</option>
                  </select>
                </td>
                <td className="py-3 pr-4">
                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    {user.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;