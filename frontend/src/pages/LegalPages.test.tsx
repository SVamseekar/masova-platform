import type { ComponentType } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import CookiePolicy from './CookiePolicy';
import RefundPolicy from './RefundPolicy';

const PAGES: [string, string, ComponentType][] = [
  ['/privacy', 'Privacy Policy', PrivacyPolicy],
  ['/terms', 'Terms of Service', TermsOfService],
  ['/cookies', 'Cookie Policy', CookiePolicy],
  ['/refunds', 'Refund Policy', RefundPolicy],
];

function renderLegal(path: string, Page: ComponentType) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Page />
    </MemoryRouter>,
  );
}

describe.each(PAGES)('legal page %s', (path, title, Page) => {
  it('renders exactly one level 1 heading with the page title', () => {
    renderLegal(path, Page);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(title);
  });

  it('links every entry in "On this page" to a section that exists', () => {
    const { container } = renderLegal(path, Page);
    const toc = screen.getByRole('navigation', { name: 'On this page' });
    const links = within(toc).getAllByRole('link');
    const sections = container.querySelectorAll('section[id^="s"]');
    expect(links).toHaveLength(sections.length);
    links.forEach((link, i) => {
      expect(link).toHaveAttribute('href', `#s${i + 1}`);
      expect(container.querySelector(`section#s${i + 1}`)).not.toBeNull();
    });
  });

  it('shows the site navigation and the footer', () => {
    renderLegal(path, Page);
    expect(screen.getAllByRole('link', { name: 'Book a walkthrough' }).length).toBeGreaterThan(0);
    expect(screen.getByText('Legal pages are published in English.')).toBeInTheDocument();
  });

  it('sets the document title and stays indexable', () => {
    renderLegal(path, Page);
    expect(document.title).toBe(`${title} | MaSoVa`);
    const robots = document.head.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute('content') ?? '').not.toMatch(/noindex/);
  });

  it('marks the current page in the row of legal links', () => {
    renderLegal(path, Page);
    const current = document.querySelector('.ms-legal-more [aria-current="page"]');
    expect(current).toHaveAttribute('href', path);
  });
});

describe('legal page claims', () => {
  it('makes none of the removed, unbacked claims on any legal page', () => {
    for (const [path, , Page] of PAGES) {
      const { container, unmount } = renderLegal(path, Page);
      expect(container.textContent).not.toMatch(/EU-hosted|Frankfurt|PSD2|encrypted (storage )?at rest|7 years|auto-execute/i);
      unmount();
    }
  });
});
