import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProductSitePage from './ProductSitePage';
import LegalPageLayout from './components/LegalPageLayout';

const renderSite = () => render(<MemoryRouter><ProductSitePage /></MemoryRouter>);

afterEach(() => vi.restoreAllMocks());

describe('Product site', () => {
  it('shows the approved hero, navigation and walkthrough actions', () => {
    renderSite();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Every location.One clear view.');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getAllByRole('link').map(link => link.textContent)).toEqual(['Product', 'AI assistants', 'Mobile apps', 'Pricing']);
    expect(screen.getAllByRole('link', { name: 'Sign in' })[0]).toHaveAttribute('href', '/staff-login');
    expect(screen.getAllByRole('button', { name: /Book a walkthrough/ }).length).toBeGreaterThan(1);
  });

  it('opens the mobile menu with a labelled close button and returns focus', async () => {
    const user = userEvent.setup();
    renderSite();
    const toggle = screen.getByRole('button', { name: 'Open menu' });
    await user.click(toggle);
    const menu = screen.getByRole('dialog', { name: 'Menu' });
    expect(within(menu).getByRole('button', { name: 'Close' })).toHaveFocus();
    expect(within(menu).getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });

  it('switches platform tour tabs and assistant details', async () => {
    const user = userEvent.setup();
    renderSite();
    const tabs = within(screen.getByRole('tablist', { name: 'Platform areas' })).getAllByRole('tab');
    expect(tabs.map(tab => tab.textContent)).toEqual(['Ordering', 'Kitchen', 'Delivery', 'Payments', 'Aggregators', 'Analytics']);
    await user.click(tabs[3]);
    expect(tabs[3]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Refunds need manager approval')).toBeInTheDocument();

    const assistants = within(screen.getByRole('group', { name: 'Choose an assistant' })).getAllByRole('button');
    expect(assistants).toHaveLength(8);
    await user.click(screen.getByRole('button', { name: /Dynamic pricing/ }));
    expect(screen.getByText('Suggested menu price change')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dynamic pricing/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Runs during service')).toBeInTheDocument();
  });

  it('filters the sample kitchen queue and shows an empty stage honestly', async () => {
    const user = userEvent.setup();
    renderSite();
    const stages = screen.getByRole('tablist', { name: 'Kitchen queue stage' });
    await user.click(within(stages).getByRole('tab', { name: /Ready/ }));
    const panel = screen.getByRole('tabpanel', { name: 'Ready sample orders' });
    expect(within(panel).getAllByRole('row')).toHaveLength(2);
    expect(within(panel).getByText('Lukas Weber')).toBeInTheDocument();
  });

  it('reveals the cashier preview and answers the selected question', async () => {
    const user = userEvent.setup();
    renderSite();
    await user.click(screen.getByRole('button', { name: 'Cashier' }));
    expect(screen.getByText('Cashier app')).toBeInTheDocument();
    expect(screen.queryByText('Manager app')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'How is VAT handled?' }));
    expect(screen.getByText(/VAT is calculated per country/)).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter questions by topic' }), 'Channels');
    expect(screen.getByText(/join the same kitchen queue as your direct/)).toBeInTheDocument();
  });

  it('validates the walkthrough request and reports a failed send without losing input', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderSite();
    await user.click(screen.getByRole('button', { name: 'Submit request' }));
    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
    expect(screen.getByText('Agree to the Privacy Policy to send your request')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/)).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/Full name/), 'Test Owner');
    await user.type(screen.getByLabelText(/Work email/), 'owner@example.com');
    await user.type(screen.getByLabelText(/Restaurant \/ brand name/), 'Test Kitchen');
    await user.type(screen.getByLabelText(/City/), 'Berlin');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Submit request' }));
    expect(await screen.findByText(/Your request was not sent/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/)).toHaveValue('Test Owner');
  });

  it('confirms a sent walkthrough request', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    renderSite();
    await user.type(screen.getByLabelText(/Full name/), 'Test Owner');
    await user.type(screen.getByLabelText(/Work email/), 'owner@example.com');
    await user.type(screen.getByLabelText(/Restaurant \/ brand name/), 'Test Kitchen');
    await user.type(screen.getByLabelText(/City/), 'Berlin');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Submit request' }));
    expect(await screen.findByText('We received your request')).toBeInTheDocument();
    expect(screen.getByText('owner@example.com')).toBeInTheDocument();
    expect(screen.getByText('We received your request').closest('[role="status"]')).toHaveFocus();
  });

  it('treats a provider failure inside a 200 response as not sent', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ success: 'false', message: 'not activated' }), { status: 200 }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderSite();
    await user.type(screen.getByLabelText(/Full name/), 'Test Owner');
    await user.type(screen.getByLabelText(/Work email/), 'owner@example.com');
    await user.type(screen.getByLabelText(/Restaurant \/ brand name/), 'Test Kitchen');
    await user.type(screen.getByLabelText(/City/), 'Berlin');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Submit request' }));
    expect(await screen.findByText(/Your request was not sent/)).toBeInTheDocument();
    expect(screen.queryByText('We received your request')).not.toBeInTheDocument();
  });

  it('moves between platform tour tabs with the arrow keys', async () => {
    const user = userEvent.setup();
    renderSite();
    const tabs = within(screen.getByRole('tablist', { name: 'Platform areas' })).getAllByRole('tab');
    tabs[0].focus();
    await user.keyboard('{ArrowRight}');
    expect(tabs[1]).toHaveFocus();
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('tabindex', '-1');
  });
});

describe('Legal document layout', () => {
  it('marks the active document and lists the sections on the page', async () => {
    render(<MemoryRouter initialEntries={['/privacy']}>
      <LegalPageLayout title="Privacy Policy" updated="10 Oct 2026">
        <section><h2>1. Information we collect</h2><p>Sample.</p></section>
        <section><h2>2. How we use information</h2><p>Sample.</p></section>
      </LegalPageLayout>
    </MemoryRouter>);
    const legal = screen.getByRole('navigation', { name: 'Legal documents' });
    expect(within(legal).getByRole('link', { name: 'Privacy' })).toHaveAttribute('aria-current', 'page');
    expect(within(legal).getByRole('link', { name: 'Terms' })).not.toHaveAttribute('aria-current');
    const contents = await screen.findByRole('navigation', { name: 'On this page' });
    expect(within(contents).getByRole('link', { name: '1. Information we collect' })).toHaveAttribute('href', '#section-1');
    expect(within(contents).getAllByRole('link')).toHaveLength(2);
  });
});
