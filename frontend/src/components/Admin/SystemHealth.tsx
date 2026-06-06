import React, { useEffect, useState } from 'react';
import { getSystemHealth, type SystemHealth as Health } from '../../api/adminApi';

const getStatusStyle = (status: 'healthy' | 'degraded' | 'down') => {
  if (status === 'healthy') {
    return 'bg-green-100 text-green-800';
  }

  if (status === 'degraded') {
    return 'bg-yellow-100 text-yellow-800';
  }

  return 'bg-red-100 text-red-800';
};

export const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const response = await getSystemHealth();
        setHealth(response);
      } catch (error) {
        console.error('Failed to load system health:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHealth();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Loading system health...</div>;
  }

  if (!health) {
    return <div className="p-6 text-sm text-red-600">System health unavailable.</div>;
  }

  const checks = [
    { label: 'API Gateway', value: health.api },
    { label: 'AI Orchestration', value: health.orchestration },
    { label: 'Database', value: health.database },
    { label: 'Queue Worker', value: health.queue },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checks.map((check) => (
          <div key={check.label} className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">{check.label}</p>
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getStatusStyle(check.value)}`}>
              {check.value}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-500">
        Last updated: {new Date(health.lastUpdated).toLocaleString()}
      </p>
    </div>
  );
};

export default SystemHealth;