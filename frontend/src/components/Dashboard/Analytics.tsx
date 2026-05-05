import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Clock, Zap } from 'lucide-react';
import { getDashboardMetrics } from '../../api/analyticsApi';
import { Skeleton } from '../Common/Skeleton';

export const Analytics: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!metrics) {
    return <div className="text-center py-8 text-gray-500">Failed to load analytics</div>;
  }

  const cards = [
    {
      title: 'Total Tickets',
      value: metrics.ticketMetrics.total,
      icon: TrendingUp,
      color: 'blue',
    },
    {
      title: 'Resolved',
      value: metrics.ticketMetrics.resolved,
      icon: Zap,
      color: 'green',
    },
    {
      title: 'Active Agents',
      value: metrics.agentMetrics.activeAgents,
      icon: Users,
      color: 'purple',
    },
    {
      title: 'Avg Handle Time',
      value: `${metrics.agentMetrics.avgHandleTime}m`,
      icon: Clock,
      color: 'orange',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ title, value, icon: Icon, color }, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
              </div>
              <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
                <Icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Tickets per Hour</h3>
          <div className="h-48 flex items-center justify-center bg-gray-50 rounded text-gray-500">
            📊 Chart visualization (coming soon)
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Resolution Rate</h3>
          <div className="h-48 flex items-center justify-center bg-gray-50 rounded text-gray-500">
            📈 Chart visualization (coming soon)
          </div>
        </div>
      </div>

      {/* CSAT Score */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Customer Satisfaction</h3>
        <div className="flex items-center justify-between">
          <p className="text-5xl font-bold text-green-600">
            {metrics.agentMetrics.csat.toFixed(1)}/5.0
          </p>
          <p className="text-gray-600 text-sm">
            Based on post-interaction surveys from {metrics.ticketMetrics.resolved} resolved tickets
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
