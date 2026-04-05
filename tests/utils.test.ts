import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'included', false && 'excluded');
    expect(result).toBe('base included');
  });

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-4 py-2', 'px-6');
    expect(result).toBe('py-2 px-6');
  });

  it('should handle undefined values', () => {
    const result = cn('base', undefined, 'end');
    expect(result).toBe('base end');
  });

  it('should handle null values', () => {
    const result = cn('base', null, 'end');
    expect(result).toBe('base end');
  });

  it('should handle empty strings', () => {
    const result = cn('base', '', 'end');
    expect(result).toBe('base end');
  });

  it('should handle object syntax for conditional classes', () => {
    const result = cn({
      'class-a': true,
      'class-b': false,
      'class-c': true,
    });
    expect(result).toBe('class-a class-c');
  });

  it('should handle array of classes', () => {
    const result = cn(['arr-class-1', 'arr-class-2'], 'single-class');
    expect(result).toContain('arr-class-1');
    expect(result).toContain('arr-class-2');
    expect(result).toContain('single-class');
  });

  it('should override conflicting tailwind classes', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('should handle complex tailwind merges', () => {
    const result = cn(
      'p-4 m-2',
      'p-6',
      'hover:bg-blue-500 hover:bg-red-500'
    );
    expect(result).toBe('m-2 p-6 hover:bg-red-500');
  });
});