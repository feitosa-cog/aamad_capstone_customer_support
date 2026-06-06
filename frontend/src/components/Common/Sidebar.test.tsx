import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

const renderSidebar = () =>
  render(
    <MemoryRouter
      initialEntries={['/dashboard']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Sidebar />
    </MemoryRouter>
  );

afterEach(() => {
  useAuthStore.setState({ token: null, user: null, error: null });
  useUIStore.setState({ sidebarOpen: false });
});

describe('Sidebar role rendering', () => {
  it('shows requestor navigation items', () => {
    useAuthStore.setState({
      token: 'token',
      user: {
        id: 'u1',
        email: 'customer@example.com',
        role: 'REQUESTOR',
        name: 'Customer Requestor',
      },
    });

    renderSidebar();

    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('My Tickets')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.queryByText('Agent Workspace')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin Console')).not.toBeInTheDocument();
  });

  it('shows real agent navigation items', () => {
    useAuthStore.setState({
      token: 'token',
      user: {
        id: 'u2',
        email: 'agent1@company.com',
        role: 'REAL_AGENT',
        name: 'Agent One',
      },
    });

    renderSidebar();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Agent Workspace')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.queryByText('Chat')).not.toBeInTheDocument();
    expect(screen.queryByText('My Tickets')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin Console')).not.toBeInTheDocument();
  });

  it('shows platform admin navigation items', () => {
    useAuthStore.setState({
      token: 'token',
      user: {
        id: 'u3',
        email: 'admin@company.com',
        role: 'PLATFORM_ADMIN',
        name: 'Platform Admin',
      },
    });

    renderSidebar();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Agent Workspace')).toBeInTheDocument();
    expect(screen.getByText('Admin Console')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.queryByText('Chat')).not.toBeInTheDocument();
    expect(screen.queryByText('My Tickets')).not.toBeInTheDocument();
  });
});