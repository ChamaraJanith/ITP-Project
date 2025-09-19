// PatientAutocomplete.js
import React, { useState, useEffect } from 'react';
import './PatientAutocomplete.css';

const PatientAutocomplete = ({
  search,
  onSearchChange,
  onSearch,
  patientsList,
  onSelectPatient,
  searchError,
  isSearching
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setShowSuggestions(patientsList.length > 0);
  }, [patientsList]);

  const handleSelectPatient = (patient) => {
    onSelectPatient(patient);
    setShowSuggestions(false);
  };

  return (
    <div className="patient-autocomplete">
      <div className="pf-search-container">
        <input
          type="text"
          placeholder="Enter patient name or patient id..."
          value={search}
          onChange={onSearchChange}
          onFocus={() => setShowSuggestions(patientsList.length > 0)}
          className={`pf-input ${searchError ? 'pf-error' : ''}`}
        />
        <button
          type="button"
          onClick={onSearch}
          disabled={!search.trim() || search.length < 2 || isSearching}
          className="pf-button pf-search-button"
        >
          {isSearching ? (
            <div className="pf-spinner"></div>
          ) : (
            "Search"
          )}
        </button>
      </div>
      
      {showSuggestions && (
        <div className="patient-suggestions">
          {patientsList.map((p) => (
            <div
              key={p._id}
              onClick={() => handleSelectPatient(p)}
              className="patient-suggestion-item"
            >
              <div className="pf-patient-name">{p.firstName} {p.lastName}</div>
              <div className="pf-patient-details">{p.gender}, {p.phone}</div>
            </div>
          ))}
        </div>
      )}
      
      {searchError && <div className="pf-error-text">{searchError}</div>}
    </div>
  );
};

export default PatientAutocomplete;