import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

describe('Tabs Components', () => {
  function renderTabs(defaultValue = 'tab1') {
    return render(
      <Tabs defaultValue={defaultValue}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content for Tab 1</TabsContent>
        <TabsContent value="tab2">Content for Tab 2</TabsContent>
        <TabsContent value="tab3">Content for Tab 3</TabsContent>
      </Tabs>
    );
  }

  describe('Tabs', () => {
    it('renders without crashing', () => {
      renderTabs();
      expect(screen.getByText('Tab 1')).toBeInTheDocument();
    });

    it('renders all tab triggers', () => {
      renderTabs();
      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });

    it('shows content for the default tab', () => {
      renderTabs('tab1');
      expect(screen.getByText('Content for Tab 1')).toBeInTheDocument();
    });

    it('hides content for non-active tabs', () => {
      renderTabs('tab1');
      expect(screen.queryByText('Content for Tab 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Content for Tab 3')).not.toBeInTheDocument();
    });

    it('can start with a different default value', () => {
      renderTabs('tab2');
      expect(screen.queryByText('Content for Tab 1')).not.toBeInTheDocument();
      expect(screen.getByText('Content for Tab 2')).toBeInTheDocument();
    });

    it('accepts custom style prop', () => {
      const { container } = render(
        <Tabs defaultValue="t1" style={{ maxWidth: '600px' }}>
          <TabsList>
            <TabsTrigger value="t1">T1</TabsTrigger>
          </TabsList>
          <TabsContent value="t1">C1</TabsContent>
        </Tabs>
      );
      expect(container.firstChild).toHaveStyle({ maxWidth: '600px' });
    });
  });

  describe('TabsList', () => {
    it('renders children tab triggers', () => {
      renderTabs();
      const triggers = screen.getAllByRole('button');
      expect(triggers).toHaveLength(3);
    });

    it('renders with flex display', () => {
      const { container } = render(
        <Tabs defaultValue="t1">
          <TabsList data-testid="list">
            <TabsTrigger value="t1">T1</TabsTrigger>
          </TabsList>
          <TabsContent value="t1">C1</TabsContent>
        </Tabs>
      );
      expect(screen.getByTestId('list')).toHaveStyle({ display: 'flex' });
    });

    it('accepts custom style prop', () => {
      render(
        <Tabs defaultValue="t1">
          <TabsList data-testid="list" style={{ padding: '8px' }}>
            <TabsTrigger value="t1">T1</TabsTrigger>
          </TabsList>
          <TabsContent value="t1">C1</TabsContent>
        </Tabs>
      );
      expect(screen.getByTestId('list')).toHaveStyle({ padding: '8px' });
    });
  });

  describe('TabsTrigger', () => {
    it('renders as a button element', () => {
      renderTabs();
      expect(screen.getByRole('button', { name: 'Tab 1' })).toBeInTheDocument();
    });

    it('switches active tab on click', async () => {
      const user = userEvent.setup();
      renderTabs('tab1');

      expect(screen.getByText('Content for Tab 1')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Tab 2' }));
      expect(screen.queryByText('Content for Tab 1')).not.toBeInTheDocument();
      expect(screen.getByText('Content for Tab 2')).toBeInTheDocument();
    });

    it('cycles through all tabs correctly', async () => {
      const user = userEvent.setup();
      renderTabs('tab1');

      await user.click(screen.getByRole('button', { name: 'Tab 2' }));
      expect(screen.getByText('Content for Tab 2')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Tab 3' }));
      expect(screen.getByText('Content for Tab 3')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Tab 1' }));
      expect(screen.getByText('Content for Tab 1')).toBeInTheDocument();
    });

    it('renders with no background by default', () => {
      renderTabs();
      expect(screen.getByRole('button', { name: 'Tab 1' })).toHaveStyle({ background: 'none' });
    });

    it('renders with no visible border', () => {
      renderTabs();
      expect(screen.getByRole('button', { name: 'Tab 1' })).toHaveStyle({ border: 'none' });
    });

    it('renders with cursor pointer', () => {
      renderTabs();
      expect(screen.getByRole('button', { name: 'Tab 1' })).toHaveStyle({ cursor: 'pointer' });
    });

    it('accepts custom style prop', () => {
      render(
        <Tabs defaultValue="t1">
          <TabsList>
            <TabsTrigger value="t1" style={{ fontWeight: 'bold' }}>T1</TabsTrigger>
          </TabsList>
          <TabsContent value="t1">C1</TabsContent>
        </Tabs>
      );
      expect(screen.getByRole('button', { name: 'T1' })).toHaveStyle({ fontWeight: 'bold' });
    });

    it('throws error when used outside Tabs context', () => {
      expect(() => {
        render(<TabsTrigger value="orphan">Orphan</TabsTrigger>);
      }).toThrow('TabsTrigger must be used within Tabs');
    });
  });

  describe('TabsContent', () => {
    it('renders content for the active tab', () => {
      renderTabs('tab1');
      expect(screen.getByText('Content for Tab 1')).toBeInTheDocument();
    });

    it('returns null for inactive tabs', () => {
      renderTabs('tab1');
      expect(screen.queryByText('Content for Tab 2')).not.toBeInTheDocument();
    });

    it('accepts custom style prop', () => {
      render(
        <Tabs defaultValue="t1">
          <TabsList>
            <TabsTrigger value="t1">T1</TabsTrigger>
          </TabsList>
          <TabsContent value="t1" data-testid="content" style={{ padding: '20px' }}>
            Content
          </TabsContent>
        </Tabs>
      );
      expect(screen.getByTestId('content')).toHaveStyle({ padding: '20px' });
    });

    it('throws error when used outside Tabs context', () => {
      expect(() => {
        render(<TabsContent value="orphan">Orphan</TabsContent>);
      }).toThrow('TabsContent must be used within Tabs');
    });

    it('spreads additional HTML attributes', () => {
      render(
        <Tabs defaultValue="t1">
          <TabsList>
            <TabsTrigger value="t1">T1</TabsTrigger>
          </TabsList>
          <TabsContent value="t1" data-testid="panel" role="tabpanel">
            Panel content
          </TabsContent>
        </Tabs>
      );
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });
  });
});
