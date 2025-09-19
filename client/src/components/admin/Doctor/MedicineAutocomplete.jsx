// MedicineAutocomplete.js
import React, { useState, useEffect, useRef } from 'react';
import './MedicineAutocomplete.css';

const MedicineAutocomplete = ({
  value,
  onChange,
  onSelect,
  medicines,
  error
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);

  // Validation pattern for medicine names (letters, spaces, hyphens, apostrophes only)
  const validateMedicineName = (inputValue) => {
    // Remove any characters that don't match the pattern
    return inputValue.replace(/[^a-zA-Z\s\-'.]/g, '');
  };

  useEffect(() => {
    if (value.trim() === '') {
      setFilteredMedicines([]);
      return;
    }

    const filtered = medicines.filter(medicine =>
      medicine.name.toLowerCase().includes(value.toLowerCase())
    );
    
    setFilteredMedicines(filtered);
    setShowSuggestions(filtered.length > 0);
    setHighlightedIndex(-1);
  }, [value, medicines]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredMedicines.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredMedicines.length) {
          handleSelectMedicine(filteredMedicines[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  const handleSelectMedicine = (medicine) => {
    onChange(medicine.name);
    onSelect(medicine);
    setShowSuggestions(false);
  };

  const handleInputChange = (e) => {
    // Validate the input to only allow valid characters
    const validatedValue = validateMedicineName(e.target.value);
    onChange(validatedValue);
  };

  return (
    <div className="medicine-autocomplete" ref={containerRef}>
      <input
        type="text"
        placeholder="Medicine Name (letters only)"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowSuggestions(filteredMedicines.length > 0)}
        className={`pf-input ${error ? 'pf-error' : ''}`}
      />
      
      {showSuggestions && (
        <div className="medicine-suggestions">
          {filteredMedicines.map((medicine, index) => (
            <div
              key={medicine.name}
              onClick={() => handleSelectMedicine(medicine)}
              className={`medicine-suggestion-item ${
                index === highlightedIndex ? 'highlighted' : ''
              }`}
            >
              <div className="medicine-name">{medicine.name}</div>
              <div className="medicine-details">
                {medicine.dosage} • {medicine.frequency} • {medicine.duration}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {error && <div className="pf-error-text">{error.message}</div>}
      
      {/* Add validation hint */}
      <div className="pf-validation-hint">
        Only letters, spaces, hyphens, and apostrophes are allowed
      </div>
    </div>
  );
};

export default MedicineAutocomplete;