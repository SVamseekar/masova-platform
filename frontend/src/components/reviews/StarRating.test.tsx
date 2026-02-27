import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StarRating from './StarRating';

describe('StarRating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<StarRating rating={3} />);
    // Should render 5 star buttons by default
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('renders the correct number of stars based on maxRating', () => {
    render(<StarRating rating={3} maxRating={10} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(10);
  });

  it('renders star buttons with correct aria labels', () => {
    render(<StarRating rating={3} />);
    expect(screen.getByLabelText('Rate 1 stars')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate 5 stars')).toBeInTheDocument();
  });

  it('calls onRatingChange when a star is clicked in interactive mode', async () => {
    const user = userEvent.setup();
    const onRatingChange = vi.fn();

    render(<StarRating rating={3} onRatingChange={onRatingChange} />);

    await user.click(screen.getByLabelText('Rate 4 stars'));
    expect(onRatingChange).toHaveBeenCalledWith(4);
  });

  it('does not call onRatingChange when readonly', async () => {
    const user = userEvent.setup();
    const onRatingChange = vi.fn();

    render(<StarRating rating={3} onRatingChange={onRatingChange} readonly />);

    await user.click(screen.getByLabelText('Rate 4 stars'));
    expect(onRatingChange).not.toHaveBeenCalled();
  });

  it('disables star buttons when readonly', () => {
    render(<StarRating rating={3} readonly />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('shows rating value text when showValue is true', () => {
    render(<StarRating rating={3.5} showValue />);
    expect(screen.getByText('3.5 / 5')).toBeInTheDocument();
  });

  it('does not show rating value when showValue is false', () => {
    render(<StarRating rating={3.5} />);
    expect(screen.queryByText('3.5 / 5')).not.toBeInTheDocument();
  });

  it('shows custom max rating in value text', () => {
    render(<StarRating rating={7} maxRating={10} showValue />);
    expect(screen.getByText('7.0 / 10')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StarRating rating={3} className="custom-stars" />);
    expect(container.querySelector('.custom-stars')).toBeInTheDocument();
  });

  it('handles zero rating', () => {
    render(<StarRating rating={0} showValue />);
    expect(screen.getByText('0.0 / 5')).toBeInTheDocument();
  });

  it('handles rating of 5 (max)', () => {
    render(<StarRating rating={5} showValue />);
    expect(screen.getByText('5.0 / 5')).toBeInTheDocument();
  });
});
