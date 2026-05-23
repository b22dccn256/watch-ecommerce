import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCartStore } from './useCartStore';
import { useUserStore } from './useUserStore';
import { toast } from 'react-hot-toast';
import axios from '../lib/axios';

// Mock useUserStore
vi.mock('./useUserStore', () => {
  const state = {
    user: null,
  };
  const useUserStoreMock = (selector) => selector(state);
  useUserStoreMock.getState = () => state;
  return { useUserStore: useUserStoreMock };
});

// Mock react-hot-toast to provide both named and default exports
vi.mock('react-hot-toast', () => {
  const toastMock = {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  };
  return {
    toast: toastMock,
    default: toastMock,
  };
});

// Mock axios
vi.mock('../lib/axios', () => {
  const mockAxios = {
    get: vi.fn(),
    post: vi.fn(() => Promise.resolve({ data: { subtotal: 0, total: 0, shippingFee: 0 } })),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return { default: mockAxios };
});

describe('useCartStore - Product ID Validation & Robustness', () => {
  let store;

  beforeEach(() => {
    vi.clearAllMocks();
    store = useCartStore.getState();
    store.resetStore();
    useUserStore.getState().user = null; // Default to Guest
  });

  describe('Product ID Validation', () => {
    it('should reject invalid or malformed product ID strings', async () => {
      // Test direct string additions
      await store.addToCart('invalid-id');
      expect(toast.error).toHaveBeenCalledWith('Sản phẩm không hợp lệ hoặc thiếu mã sản phẩm');

      // Test short string ID
      await store.addToCart('6a0d');
      expect(toast.error).toHaveBeenCalledWith('Sản phẩm không hợp lệ hoặc thiếu mã sản phẩm');

      // Test too long string ID
      await store.addToCart('6a0d8905d38ea5fe36d785d3abcde');
      expect(toast.error).toHaveBeenCalledWith('Sản phẩm không hợp lệ hoặc thiếu mã sản phẩm');

      // Test invalid characters
      await store.addToCart('6a0d8905d38ea5fe36d785dz');
      expect(toast.error).toHaveBeenCalledWith('Sản phẩm không hợp lệ hoặc thiếu mã sản phẩm');

      // Ensure axios POST was not called
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should reject invalid nested product objects', async () => {
      // Test nested invalid IDs
      await store.addToCart({ _id: 'invalid-id' });
      expect(toast.error).toHaveBeenCalledWith('Sản phẩm không hợp lệ hoặc thiếu mã sản phẩm');

      await store.addToCart({ product: { _id: 'invalid-id' } });
      expect(toast.error).toHaveBeenCalledWith('Sản phẩm không hợp lệ hoặc thiếu mã sản phẩm');

      await store.addToCart({ productId: 'invalid-id' });
      expect(toast.error).toHaveBeenCalledWith('Sản phẩm không hợp lệ hoặc thiếu mã sản phẩm');

      // Ensure axios POST was not called
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should accept valid 24-character hexadecimal product ID string', async () => {
      const validId = '6a0d8905d38ea5fe36d785d3';
      
      // Guest flow
      await store.addToCart(validId);
      expect(toast.success).toHaveBeenCalledWith('Đã thêm vào giỏ hàng!');
      
      // Should call /cart/calculate but not /cart (guest flow doesn't write cart to server)
      expect(axios.post).toHaveBeenCalledWith('/cart/calculate', expect.any(Object));
      expect(axios.post).not.toHaveBeenCalledWith('/cart', expect.any(Object));

      const state = useCartStore.getState();
      expect(state.cart.length).toBe(1);
      expect(state.cart[0]._id).toBe(validId);
    });

    it('should call server API when user is logged in with valid ID', async () => {
      const validId = '6a0d8905d38ea5fe36d785d3';
      useUserStore.getState().user = { _id: 'user-id', name: 'John Doe' };
      axios.post.mockResolvedValueOnce({ data: { message: 'Added to cart' } });

      await store.addToCart(validId);

      expect(axios.post).toHaveBeenCalledWith('/cart', {
        productId: validId,
        wristSize: undefined,
        selectedColor: null,
        selectedSize: null,
      });
      expect(toast.success).toHaveBeenCalledWith('Đã thêm vào giỏ hàng!');
    });
  });
});
