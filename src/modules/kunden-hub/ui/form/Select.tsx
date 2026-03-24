import { useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  value?: string;
  className?: string;
  defaultValue?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  value: controlledValue,
  className = "",
  defaultValue = "",
}) => {
  // Manage the selected value (internal state used only when uncontrolled)
  const [internalValue, setInternalValue] = useState<string>(defaultValue);

  const isControlled = controlledValue !== undefined;
  const selectedValue = isControlled ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!isControlled) {
      setInternalValue(value);
    }
    onChange(value); // Trigger parent handler
  };

  return (
    <div className="relative">
      <select
        className={`h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2 pr-10 text-sm font-medium shadow-sm transition-all focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 hover:border-gray-300 ${
          selectedValue
            ? "text-gray-800"
            : "text-gray-400"
        } ${className}`}
        value={selectedValue}
        onChange={handleChange}
      >
        {/* Placeholder option */}
        <option value="" disabled className="text-gray-700">
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-gray-700">
            {option.label}
          </option>
        ))}
      </select>
      {/* Dropdown arrow */}
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};

export default Select;
