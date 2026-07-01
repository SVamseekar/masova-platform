import { describe, it, expect, vi } from 'vitest';
import { renderUnauthenticated, screen } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import { PrivacyPolicy } from './PrivacyPolicy';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('PrivacyPolicy', () => {
  it('renders without crashing', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument();
  });

  it('displays the last updated date', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText(/Last updated July 1, 2026/)).toBeInTheDocument();
  });

  it('renders who we are section with support email links', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText('1. Who we are')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'support@masova.com' }).length).toBeGreaterThanOrEqual(2);
  });

  it('renders GDPR rights section with email-based requests', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText('6. Your rights')).toBeInTheDocument();
    expect(screen.getByText(/we respond within 30 days as required by GDPR/)).toBeInTheDocument();
    expect(screen.queryByText('GDPR self-service portal')).not.toBeInTheDocument();
  });

  it('renders contact us button in rights section', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByRole('button', { name: 'Contact us' })).toBeInTheDocument();
  });

  it('renders cookies section', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText('9. Cookies')).toBeInTheDocument();
  });

  it('renders restaurant operator responsibilities', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText('10. Restaurant operator responsibilities')).toBeInTheDocument();
  });
});