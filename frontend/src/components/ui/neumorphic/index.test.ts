import { describe, it, expect } from 'vitest';
import {
  Button,
  Card,
  Input,
  Badge,
  Checkbox,
  LoadingSpinner,
  Skeleton,
  ProgressBar,
} from './index';

describe('Neumorphic barrel export', () => {
  it('exports Button component', () => {
    expect(Button).toBeDefined();
    expect(Button.displayName).toBe('Button');
  });

  it('exports Card component', () => {
    expect(Card).toBeDefined();
    expect(Card.displayName).toBe('Card');
  });

  it('exports Input component', () => {
    expect(Input).toBeDefined();
    expect(Input.displayName).toBe('Input');
  });

  it('exports Badge component', () => {
    expect(Badge).toBeDefined();
    expect(Badge.displayName).toBe('Badge');
  });

  it('exports Checkbox component', () => {
    expect(Checkbox).toBeDefined();
    expect(Checkbox.displayName).toBe('Checkbox');
  });

  it('exports LoadingSpinner component', () => {
    expect(LoadingSpinner).toBeDefined();
    expect(LoadingSpinner.displayName).toBe('LoadingSpinner');
  });

  it('exports Skeleton component', () => {
    expect(Skeleton).toBeDefined();
    expect(Skeleton.displayName).toBe('Skeleton');
  });

  it('exports ProgressBar component', () => {
    expect(ProgressBar).toBeDefined();
    expect(ProgressBar.displayName).toBe('ProgressBar');
  });
});
