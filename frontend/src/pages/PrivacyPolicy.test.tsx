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
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('displays the last updated date', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText(/Last Updated:/)).toBeInTheDocument();
    expect(screen.getByText(/January 1, 2025/)).toBeInTheDocument();
  });

  it('displays the effective date', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText(/Effective Date:/)).toBeInTheDocument();
  });

  it('renders Section 1: Introduction', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText('1. Introduction')).toBeInTheDocument();
    expect(screen.getByText(/committed to protecting your privacy/)).toBeInTheDocument();
  });

  it('renders Section 2: Data Controller Information', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText('2. Data Controller Information')).toBeInTheDocument();
    expect(screen.getByText(/privacy@masova.com/)).toBeInTheDocument();
  });

  it('renders Section 3: Personal Data We Collect', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText('3. Personal Data We Collect')).toBeInTheDocument();
    expect(screen.getByText('Account Information')).toBeInTheDocument();
    expect(screen.getByText('Order Information')).toBeInTheDocument();
    expect(screen.getByText('Usage Data')).toBeInTheDocument();
    expect(screen.getByText('Communication Data')).toBeInTheDocument();
  });

  it('renders Section 7: GDPR Rights', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText('7. Your GDPR Rights')).toBeInTheDocument();
    expect(screen.getByText('Right to Access')).toBeInTheDocument();
    expect(screen.getByText('Right to Erasure (Right to be Forgotten)')).toBeInTheDocument();
    expect(screen.getByText('Right to Data Portability')).toBeInTheDocument();
  });

  it('renders the "Manage My Data" button', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText('Manage My Data')).toBeInTheDocument();
  });

  it('navigates to /gdpr-requests when "Manage My Data" is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PrivacyPolicy />);
    await user.click(screen.getByText('Manage My Data'));
    expect(mockNavigate).toHaveBeenCalledWith('/gdpr-requests');
  });

  it('renders the "Contact DPO" button', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText('Contact DPO')).toBeInTheDocument();
  });

  it('navigates to /contact when "Contact DPO" is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PrivacyPolicy />);
    await user.click(screen.getByText('Contact DPO'));
    expect(mockNavigate).toHaveBeenCalledWith('/contact');
  });

  it('renders the "Return to Home" button', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText('Return to Home')).toBeInTheDocument();
  });

  it('navigates to / when "Return to Home" is clicked', async () => {
    const user = userEvent.setup();
    renderUnauthenticated(<PrivacyPolicy />);
    await user.click(screen.getByText('Return to Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('renders data retention section', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText('8. Data Retention')).toBeInTheDocument();
  });

  it('renders data security section', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText('9. Data Security')).toBeInTheDocument();
  });

  it('renders cookies section', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText('11. Cookies and Tracking')).toBeInTheDocument();
  });

  it('renders contact section with email addresses', () => {
    renderUnauthenticated(<PrivacyPolicy />);
    expect(screen.getByText('14. Contact Us')).toBeInTheDocument();
  });
});
