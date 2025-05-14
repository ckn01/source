import React, { useEffect, useState } from "react";

interface SearchableDropdownProps {
  options: { label: string; value: string }[];
  onChange: (selected: { label: string; value: string }) => void;
  placeholder?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  onChange,
  placeholder = "Search...",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const filtered = options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  const handleSelect = (option: { label: string; value: string }) => {
    onChange(option);
    setSearchTerm(option.label);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
      {isOpen && (
        <ul
          className="absolute z-[9999] bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto w-full shadow-lg"
          style={{ maxHeight: "200px" }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <li
                key={option.value}
                onClick={() => handleSelect(option)}
                className="px-3 py-2 hover:bg-cyan-100 cursor-pointer"
              >
                {option.label}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-gray-500">No results found</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableDropdown;