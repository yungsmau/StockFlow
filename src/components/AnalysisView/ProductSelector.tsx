import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import "./ProductSelector.css";

interface RowData {
  nomenclature: string;
  date: string;
  income: number;
  expense: number;
  stock: number;
}

interface UploadedFile {
  name: string;
  format: string;
  data: RowData[];
}

interface ProductSelectorProps {
  uploadedFiles: UploadedFile[];
  selectedProduct: string;
  onProductChange: (product: string) => void;
}

export default function ProductSelector({
  uploadedFiles,
  selectedProduct,
  onProductChange
}: ProductSelectorProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); 
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<HTMLDivElement[]>([]);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allProducts = useMemo(() => {
    const productsSet = new Set<string>();
    for (const file of uploadedFiles) {
      for (const row of file.data) {
        productsSet.add(row.nomenclature);
      }
    }
    return Array.from(productsSet);
  }, [uploadedFiles]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return allProducts;
    const lowerSearch = search.toLowerCase();
    return allProducts.filter(p => p.toLowerCase().includes(lowerSearch));
  }, [search, allProducts]);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      setSearch(searchInput);
      setHighlightedIndex(0);
    }, 150);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchInput]);

  const selectProduct = useCallback((product: string) => {
    onProductChange(product);
    setIsOpen(false);
    setSearchInput("");
    setSearch("");
  }, [onProductChange]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredProducts.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (filteredProducts.length > 0) {
          selectProduct(filteredProducts[highlightedIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
        
      default:
        break;
    }
  }, [isOpen, filteredProducts, highlightedIndex, selectProduct]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredProducts.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (filteredProducts.length > 0) {
          selectProduct(filteredProducts[highlightedIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }, [isOpen, filteredProducts, highlightedIndex, selectProduct]);

  useEffect(() => {
    if (!selectedProduct && allProducts.length > 0) {
      onProductChange(allProducts[0]);
    }
  }, [allProducts, selectedProduct, onProductChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'auto'
      });
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div className="param-card product-search-card">
      <div className="product-dropdown" ref={dropdownRef}>
        <div
          className="dropdown-toggle"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <span>{selectedProduct || "Выберите номенклатуру"}</span>
          <span className="dropdown-arrow">▼</span>
        </div>

        {isOpen && (
          <div className="dropdown-menu">
            <input
              type="text"
              placeholder="Поиск..."
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className="dropdown-search"
              autoFocus
              ref={searchInputRef}
            />
            <div className="dropdown-list">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p, index) => (
                  <div
                    key={p}
                    ref={(el) => {
                      if (el) {
                        itemRefs.current[index] = el;
                      }
                    }}
                    className={`dropdown-item ${p === selectedProduct ? "selected" : ""} ${index === highlightedIndex ? "highlighted" : ""}`}
                    onClick={() => selectProduct(p)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {p}
                  </div>
                ))
              ) : (
                <div className="dropdown-item disabled">Ничего не найдено</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}