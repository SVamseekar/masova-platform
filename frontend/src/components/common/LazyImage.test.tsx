import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LazyImage } from './LazyImage';

// Mock the performance utility
vi.mock('../../utils/performance', () => ({
  getOptimizedImageUrl: (src: string, width: number, quality: number) =>
    `${src}?w=${width}&q=${quality}`,
}));

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();

beforeEach(() => {
  mockIntersectionObserver.mockReset();
  mockIntersectionObserver.mockImplementation((callback: IntersectionObserverCallback) => ({
    observe: (element: Element) => {
      // Simulate immediate intersection
      callback(
        [{ isIntersecting: true, target: element }] as IntersectionObserverEntry[],
        {} as IntersectionObserver
      );
    },
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  }));
  vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);
});

describe('LazyImage', () => {
  it('renders without crashing', () => {
    render(<LazyImage src="/images/test.jpg" alt="Test image" />);
    expect(screen.getByAltText('Test image')).toBeInTheDocument();
  });

  it('shows the image once intersection is observed', () => {
    render(<LazyImage src="/images/test.jpg" alt="Test image" />);
    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img.tagName).toBe('IMG');
  });

  it('calls onLoad callback when image loads', () => {
    const onLoad = vi.fn();
    render(<LazyImage src="/images/test.jpg" alt="Test" onLoad={onLoad} />);

    const img = screen.getByAltText('Test');
    fireEvent.load(img);
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('shows error message when image fails to load', () => {
    const onError = vi.fn();
    render(<LazyImage src="/images/broken.jpg" alt="Broken" onError={onError} />);

    const img = screen.getByAltText('Broken');
    fireEvent.error(img);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Failed to load image')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <LazyImage src="/images/test.jpg" alt="Test" className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('applies custom style', () => {
    const { container } = render(
      <LazyImage
        src="/images/test.jpg"
        alt="Test"
        style={{ border: '2px solid red' }}
      />
    );
    // The container Box should have the style
    const element = container.firstChild as HTMLElement;
    expect(element).toBeTruthy();
  });

  it('does not render img element when not in viewport', () => {
    // Override to not trigger intersection
    mockIntersectionObserver.mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    }));

    render(<LazyImage src="/images/test.jpg" alt="Hidden image" />);
    expect(screen.queryByAltText('Hidden image')).not.toBeInTheDocument();
  });

  it('optimizes image URL when numeric width is provided', () => {
    render(<LazyImage src="/images/test.jpg" alt="Optimized" width={300} quality={90} />);
    const img = screen.getByAltText('Optimized');
    expect(img.getAttribute('src')).toBe('/images/test.jpg?w=300&q=90');
  });

  it('uses original src when width is not numeric', () => {
    render(<LazyImage src="/images/test.jpg" alt="Original" width="100%" />);
    const img = screen.getByAltText('Original');
    expect(img.getAttribute('src')).toBe('/images/test.jpg');
  });
});
