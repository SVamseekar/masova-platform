import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddressAutocomplete from './AddressAutocomplete';

vi.mock('@react-google-maps/api', () => ({ useJsApiLoader: () => ({ isLoaded: false }) }));
vi.mock('../../hooks/useGeocoding', () => ({ useGeocoding: () => ({ geocode: vi.fn(), loading: false }) }));
function ControlledAddress() {
  const [value, setValue] = useState('');
  return <><label htmlFor="street">Delivery street</label><AddressAutocomplete inputId="street" value={value} onInputChange={setValue} onSelect={vi.fn()} invalid describedBy="street-error" /><p id="street-error">Enter a street address</p><output data-testid="controlled-street">{value}</output></>;
}
describe('compatible address form input', () => {
  it('propagates complete manual input through associated label and ARIA', async () => {
    const client = userEvent.setup(); render(<ControlledAddress />);
    const input = screen.getByRole('textbox', { name: 'Delivery street' });
    await client.type(input, 'Hauptstrasse 12');
    expect(input).toHaveValue('Hauptstrasse 12');
    expect(screen.getByTestId('controlled-street')).toHaveTextContent('Hauptstrasse 12');
    expect(input).toHaveAccessibleDescription('Enter a street address');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
  it('keeps existing uncontrolled callers working', async () => {
    const client = userEvent.setup(); render(<AddressAutocomplete initialValue="Original street" onSelect={vi.fn()} />);
    const input = screen.getByRole('textbox'); await client.type(input, ' 2');
    expect(input).toHaveValue('Original street 2');
  });
});
