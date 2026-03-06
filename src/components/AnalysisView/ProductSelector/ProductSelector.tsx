import Select, { SingleValue, ActionMeta, StylesConfig } from 'react-select';
import './ProductSelector.css';

interface ProductOption {
  value: string;
  label: string;
}

interface ProductSelectorProps {
  uploadedFiles: any[];
  selectedProduct: string;
  onProductChange: (product: string) => void;
}

const getProducts = (uploadedFiles: any[]): ProductOption[] => {
  const products = new Set<string>();
  for (const file of uploadedFiles) {
    for (const row of file.data) {
      products.add(row.nomenclature);
    }
  }
  return Array.from(products).map(p => ({ value: p, label: p }));
};

const customStyles: StylesConfig<ProductOption> = {
  control: (provided) => ({
    ...provided,
    minHeight: '40px',
    cursor: 'pointer',
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 10,
  }),
  option: (provided) => ({
    ...provided,
    cursor: 'pointer',
  }),
};

export default function ProductSelector({
  uploadedFiles,
  selectedProduct,
  onProductChange
}: ProductSelectorProps) {
  const options = getProducts(uploadedFiles);
  const selectedOption = options.find(opt => opt.value === selectedProduct) || null;

  const handleChange = (
    newValue: SingleValue<ProductOption>,
    _actionMeta: ActionMeta<ProductOption>
  ) => {
    if (newValue) {
      onProductChange(newValue.value);
    }
  };

  return (
    <div className="param-card product-search-card">
      <Select<ProductOption, false>
        options={options}
        value={selectedOption}
        onChange={handleChange}
        placeholder="Выберите номенклатуру"
        isSearchable
        styles={customStyles}
        noOptionsMessage={() => "Ничего не найдено"}
        classNamePrefix="product-select"
      />
    </div>
  );
}