import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { supabase } from './services/supabaseClient';
import * as db from './services/db';

// Mock Vercel modules
jest.mock('@vercel/analytics/react', () => ({
  Analytics: () => null,
}), { virtual: true });
jest.mock('@vercel/speed-insights/react', () => ({
  SpeedInsights: () => null,
}), { virtual: true });

// Mock supabase
jest.mock('./services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

// Mock db services
jest.mock('./services/db', () => ({
  getUserProfile: jest.fn(),
  getAllMajorsOptions: jest.fn(),
  getAllMinorsOptions: jest.fn(),
}));

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    db.getAllMajorsOptions.mockResolvedValue([]);
    db.getAllMinorsOptions.mockResolvedValue([]);
    db.getUserProfile.mockResolvedValue(null);
  });

  test('renders 4 Year Planner brand name', async () => {
    render(<App />);

    await waitFor(() => {
      const brandElement = screen.getByText(/4 Year Planner/i);
      expect(brandElement).toBeInTheDocument();
    });
  });
});
