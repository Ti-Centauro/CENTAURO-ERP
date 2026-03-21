import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import './SearchableSelect.css';

const SearchableSelect = ({ options, value, onChange, placeholder, name, required, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  // When value changes from outside, update the display text to match the selected option's label
  useEffect(() => {
    const selectedOption = options.find(opt => String(opt.value) === String(value));
    if (selectedOption) {
      setSearchTerm(selectedOption.label);
    } else if (!value) {
      setSearchTerm('');
    }
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        // If we close without selecting, reset search term to reflect current value's label
        const selectedOption = options.find(opt => String(opt.value) === String(value));
        setSearchTerm(selectedOption ? selectedOption.label : '');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, options]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    // If user CLEARS the input, trigger empty value update
    if (!e.target.value) {
        onChange({ target: { name, value: '' } });
    }
  };

  const handleSelectOption = (option) => {
    setSearchTerm(option.label);
    setIsOpen(false);
    onChange({ target: { name, value: option.value } });
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`searchable-select-wrapper ${disabled ? 'disabled' : ''}`} ref={wrapperRef}>
      <div className="searchable-select-input-container">
        <input
          type="text"
          name={name}
          className="input searchable-select-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          required={required}
          disabled={disabled}
          autoComplete="off"
        />
        <div className="searchable-select-icon">
          <ChevronDown size={16} />
        </div>
      </div>

      {isOpen && !disabled && (
        <ul className="searchable-select-dropdown">
          {filteredOptions.length > 0 ? (
            filteredOptions.slice(0, 100).map((option) => (
              <li
                key={option.value}
                className={`searchable-select-option ${String(option.value) === String(value) ? 'selected' : ''}`}
                onClick={() => handleSelectOption(option)}
              >
                {option.label}
              </li>
            ))
          ) : (
            <li className="searchable-select-no-results">Nenhum resultado encontrado</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableSelect;
