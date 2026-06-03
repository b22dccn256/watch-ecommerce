import { useEffect, useMemo, useState } from "react";
import { useProductStore } from "../stores/useProductStore";

export const useCatalogData = () => {
  const {
    brands,
    fetchBrands,
    categories,
    fetchCategories,
    products,
    fetchAllProducts,
  } = useProductStore();
  const [activeSection, setActiveSection] = useState("brands");

  useEffect(() => {
    fetchBrands(true, true);
    fetchCategories();
    fetchAllProducts();
  }, [fetchBrands, fetchCategories, fetchAllProducts]);

  const categoryTree = useMemo(() => {
    const tree = [];
    const map = {};
    categories?.forEach((cat) => {
      map[cat._id] = { ...cat, children: [] };
    });
    categories?.forEach((cat) => {
      if (cat.parentCategory && map[cat.parentCategory]) {
        map[cat.parentCategory].children.push(map[cat._id]);
      } else {
        tree.push(map[cat._id]);
      }
    });
    return tree;
  }, [categories]);

  return {
    activeSection,
    setActiveSection,
    brands: brands || [],
    categories: categories || [],
    products: products || [],
    categoryTree,
  };
};

export default useCatalogData;
