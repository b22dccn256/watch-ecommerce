import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import useOrderForm from '../useOrderForm';

// Mock axios
vi.mock('../../lib/axios');
vi.mock('react-hot-toast');

describe('useOrderForm Hook', () => {
  const mockOrder = {
    _id: 'order-123',
    carrier: 'GHTK',
    carrierTrackingNumber: 'GHTK123456',
    refundAmount: 100000,
    internalNotes: 'Test note',
  };

  it('initializes form state from order', () => {
    const { result } = renderHook(() => useOrderForm(mockOrder));
    
    expect(result.current.form.carrier).toBe('GHTK');
    expect(result.current.form.carrierTrackingNumber).toBe('GHTK123456');
    expect(result.current.form.refundAmount).toBe(100000);
    expect(result.current.form.internalNotes).toBe('Test note');
  });

  it('updates form field', () => {
    const { result } = renderHook(() => useOrderForm(mockOrder));
    
    act(() => {
      result.current.handleChange('carrier', 'Viettel Post');
    });

    expect(result.current.form.carrier).toBe('Viettel Post');
  });

  it('handles empty initial order', () => {
    const { result } = renderHook(() => useOrderForm(null));
    
    expect(result.current.form.carrier).toBe('');
    expect(result.current.form.carrierTrackingNumber).toBe('');
  });

  it('saving state starts as false', () => {
    const { result } = renderHook(() => useOrderForm(mockOrder));
    expect(result.current.saving).toBe(false);
  });
});
