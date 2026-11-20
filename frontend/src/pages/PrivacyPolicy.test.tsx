import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PrivacyPolicy } from './PrivacyPolicy';

function renderPrivacy() {
  return render(
    <MemoryRouter initialEntries={['/privacy']}>
      <PrivacyPolicy />
    </MemoryRouter>,
  );
}

describe('PrivacyPolicy', () => {
  it('renders the page title as the only level 1 heading', () => {
    renderPrivacy();
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
  });

  it('displays the last updated date', () => {
    renderPrivacy();
    expect(screen.getByText('Last updated 17 November 2026')).toBeInTheDocument();
  });

  it('names who we are with links to the general and privacy addresses', () => {
    renderPrivacy();
    expect(screen.getByRole('heading', { level: 2, name: /Who we are/ })).toBeInTheDocument();
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('mailto:hello@getmasova.rest');
    expect(hrefs).toContain('mailto:privacy@getmasova.rest');
  });

  it('explains GDPR rights and the one-month response time', () => {
    renderPrivacy();
    expect(screen.getByRole('heading', { level: 2, name: /Your rights/ })).toBeInTheDocument();
    expect(screen.getByText(/respond within one month/)).toBeInTheDocument();
  });

  it('ends with a link to the contact page instead of a button', () => {
    renderPrivacy();
    expect(screen.queryByRole('button', { name: 'Contact us' })).not.toBeInTheDocument();
    const contact = screen.getAllByRole('link', { name: 'Contact' }).find((link) => link.closest('.ms-legal-more'));
    expect(contact).toHaveAttribute('href', '/contact');
  });

  it('has a cookies section linking to the cookie policy', () => {
    renderPrivacy();
    expect(screen.getByRole('heading', { level: 2, name: /Cookies/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'cookie policy' })).toHaveAttribute('href', '/cookies');
  });

  it('states what restaurants remain responsible for', () => {
    renderPrivacy();
    expect(screen.getByRole('heading', { level: 2, name: /What restaurants remain responsible for/ })).toBeInTheDocument();
  });
});
