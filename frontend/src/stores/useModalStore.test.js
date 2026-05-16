import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useModalStore from './useModalStore';

describe('useModalStore - Modal Management Integration', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useModalStore());
    act(() => {
      result.current.closeAll();
    });
  });

  describe('modal lifecycle', () => {
    it('should open a modal', () => {
      const { result } = renderHook(() => useModalStore());

      act(() => {
        result.current.openModal('editProduct');
      });

      expect(result.current.isOpen('editProduct')).toBe(true);
    });

    it('should close a modal', () => {
      const { result } = renderHook(() => useModalStore());

      act(() => {
        result.current.openModal('editProduct');
        result.current.closeModal('editProduct');
      });

      expect(result.current.isOpen('editProduct')).toBe(false);
    });

    it('should toggle modal open/close', () => {
      const { result } = renderHook(() => useModalStore());

      act(() => {
        result.current.toggleModal('editProduct');
      });

      expect(result.current.isOpen('editProduct')).toBe(true);

      act(() => {
        result.current.toggleModal('editProduct');
      });

      expect(result.current.isOpen('editProduct')).toBe(false);
    });

    it('should close all modals', () => {
      const { result } = renderHook(() => useModalStore());

      act(() => {
        result.current.openModal('editProduct');
        result.current.openModal('deleteConfirm');
        result.current.openModal('priceAdjust');
        result.current.closeAll();
      });

      expect(result.current.isOpen('editProduct')).toBe(false);
      expect(result.current.isOpen('deleteConfirm')).toBe(false);
      expect(result.current.isOpen('priceAdjust')).toBe(false);
    });
  });

  describe('modal data management', () => {
    it('should store and retrieve modal data', () => {
      const { result } = renderHook(() => useModalStore());

      const testData = { id: 1, name: 'Product A', price: 100 };

      act(() => {
        result.current.openModal('editProduct', testData);
      });

      expect(result.current.getModalData('editProduct')).toEqual(testData);
    });

    it('should update modal data', () => {
      const { result } = renderHook(() => useModalStore());

      const initialData = { id: 1, name: 'Product A' };
      const updatedData = { id: 1, name: 'Product B' };

      act(() => {
        result.current.openModal('editProduct', initialData);
        result.current.updateModalData('editProduct', updatedData);
      });

      expect(result.current.getModalData('editProduct')).toEqual(updatedData);
    });

    it('should clear data when closing modal', () => {
      const { result } = renderHook(() => useModalStore());

      act(() => {
        result.current.openModal('editProduct', { id: 1, name: 'Test' });
        result.current.closeModal('editProduct');
      });

      expect(result.current.getModalData('editProduct')).toBeNull();
    });
  });

  describe('multiple modals', () => {
    it('should handle multiple modals independently', () => {
      const { result } = renderHook(() => useModalStore());

      const editData = { id: 1, name: 'Product' };
      const deleteData = { id: 1, name: 'Product', confirmation: false };

      act(() => {
        result.current.openModal('editProduct', editData);
        result.current.openModal('deleteConfirm', deleteData);
      });

      expect(result.current.isOpen('editProduct')).toBe(true);
      expect(result.current.isOpen('deleteConfirm')).toBe(true);
      expect(result.current.getModalData('editProduct')).toEqual(editData);
      expect(result.current.getModalData('deleteConfirm')).toEqual(deleteData);
    });

    it('should get list of open modals', () => {
      const { result } = renderHook(() => useModalStore());

      act(() => {
        result.current.openModal('editProduct');
        result.current.openModal('deleteConfirm');
      });

      const openModals = result.current.getOpenModals();
      
      expect(openModals).toContain('editProduct');
      expect(openModals).toContain('deleteConfirm');
      expect(openModals.length).toBe(2);
    });
  });

  describe('common modal workflows', () => {
    it('should handle create then cancel workflow', () => {
      const { result } = renderHook(() => useModalStore());

      act(() => {
        result.current.openModal('createProduct');
      });

      expect(result.current.isOpen('createProduct')).toBe(true);

      act(() => {
        result.current.closeModal('createProduct');
      });

      expect(result.current.isOpen('createProduct')).toBe(false);
    });

    it('should handle confirm delete workflow', () => {
      const { result } = renderHook(() => useModalStore());

      const productData = { id: 1, name: 'Delete me' };

      act(() => {
        result.current.openModal('deleteConfirm', productData);
      });

      expect(result.current.isOpen('deleteConfirm')).toBe(true);
      expect(result.current.getModalData('deleteConfirm')).toEqual(productData);

      act(() => {
        result.current.closeModal('deleteConfirm');
      });

      expect(result.current.isOpen('deleteConfirm')).toBe(false);
    });

    it('should handle nested modal workflow', () => {
      const { result } = renderHook(() => useModalStore());

      act(() => {
        result.current.openModal('mainModal', { step: 1 });
        result.current.openModal('nestedModal', { parentId: 1 });
      });

      expect(result.current.isOpen('mainModal')).toBe(true);
      expect(result.current.isOpen('nestedModal')).toBe(true);

      act(() => {
        result.current.closeModal('nestedModal');
      });

      expect(result.current.isOpen('mainModal')).toBe(true);
      expect(result.current.isOpen('nestedModal')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle closing non-existent modal gracefully', () => {
      const { result } = renderHook(() => useModalStore());

      act(() => {
        result.current.closeModal('nonExistent');
      });

      expect(result.current.isOpen('nonExistent')).toBe(false);
    });

    it('should handle opening same modal twice', () => {
      const { result } = renderHook(() => useModalStore());

      act(() => {
        result.current.openModal('editProduct', { id: 1 });
        result.current.openModal('editProduct', { id: 2 });
      });

      expect(result.current.isOpen('editProduct')).toBe(true);
      expect(result.current.getModalData('editProduct')).toEqual({ id: 2 });
    });

    it('should handle rapid open/close cycles', () => {
      const { result } = renderHook(() => useModalStore());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.toggleModal('testModal');
        }
      });

      // After 5 toggles, should be open (started closed)
      expect(result.current.isOpen('testModal')).toBe(true);
    });
  });
});
