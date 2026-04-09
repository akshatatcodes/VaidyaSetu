"use client";
import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

interface AutocompleteInputProps {
  placeholder: string;
  fetchUrl: string;
  onAdd: (value: string) => void;
  iconColorClass: string;
}

export default function AutocompleteInput({ placeholder, fetchUrl, onAdd, iconColorClass }: AutocompleteInputProps) {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(fetchUrl)
      .then(async r => {
        if (!r.ok) return [];
        const text = await r.text();
        try { return JSON.parse(text); } catch { return []; }
      })
      .then(data => setOptions(Array.isArray(data) ? data : []))
      .catch(e => console.error("Failed to fetch autocomplete list", e));
  }, [fetchUrl]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = input.trim() === "" 
    ? [] 
    : options.filter(o => o.toLowerCase().includes(input.toLowerCase()));

  const handleSelect = (val: string) => {
    onAdd(val);
    setInput("");
    setShowDropdown(false);
  };

  const handleAddClick = () => {
    if (input.trim()) handleSelect(input.trim());
  };

  return (
    <div className="relative flex space-x-2 mb-4" ref={wrapperRef}>
      <div className="relative flex-1">
        <input 
          type="text" 
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddClick();
          }}
          placeholder={placeholder}
          className={`w-full bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-${iconColorClass}`}
        />
        
        {showDropdown && input.trim() !== "" && (
          <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSelect(opt)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 transition-colors"
                >
                  {opt}
                </button>
              ))
            ) : (
              <button 
                onClick={() => handleSelect(input)}
                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 transition-colors"
              >
                Add custom "{input}"...
              </button>
            )}
          </div>
        )}
      </div>
      
      <button onClick={handleAddClick} className={`bg-${iconColorClass} hover:opacity-80 text-white px-4 py-2 rounded-lg transition-colors`}>
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
