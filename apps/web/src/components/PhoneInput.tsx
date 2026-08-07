import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import { COUNTRIES, type Country } from "../lib/countries";

interface PhoneInputProps {
  label: string;
  onChange: (fullNumber: string) => void;
  disabled?: boolean;
}

export default function PhoneInput({ label, onChange, disabled }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    COUNTRIES.find((c) => c.code === "KE") || COUNTRIES[0]
  );
  const [phoneNumberRest, setPhoneNumberRest] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES;
    const query = searchQuery.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.dialCode.includes(query) ||
        c.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handlePhoneRestChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    setPhoneNumberRest(clean);
    onChange(`${selectedCountry.dialCode}${clean}`);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchQuery("");
    onChange(`${country.dialCode}${phoneNumberRest}`);
  };

  return (
    <div className="space-y-1.5" ref={dropdownRef}>
      <label className="text-sm font-medium text-ink-700 dark:text-ink-100">{label}</label>
      
      {/* Country selection dropdown button */}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between rounded-md border border-ink-200/80 bg-white px-2.5 py-2 text-[13px] text-ink-800 focus:outline-none dark:border-white/10 dark:bg-surface-raised-dark dark:text-ink-100 disabled:opacity-50"
        >
          <span className="flex items-center gap-2">
            <span className="text-base select-none">{selectedCountry.flag}</span>
            <span className="font-medium">{selectedCountry.name}</span>
            <span className="text-ink-400">(+{selectedCountry.dialCode})</span>
          </span>
          <ChevronDown size={14} className="text-ink-400" />
        </button>

        {isDropdownOpen && (
          <div className="absolute left-0 right-0 z-30 mt-1 rounded-md border border-ink-200/80 bg-white shadow-lg dark:border-white/10 dark:bg-surface-dark max-h-60 overflow-hidden flex flex-col">
            <div className="flex items-center gap-1.5 border-b border-ink-100/60 dark:border-white/10 px-2.5 py-2">
              <Search size={14} className="text-ink-400" />
              <input
                type="text"
                placeholder="Search country or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-0 bg-transparent p-0 text-[13px] text-ink-800 focus:outline-none focus:ring-0 dark:text-ink-100"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto grow py-1">
              {filteredCountries.length === 0 ? (
                <div className="px-3 py-2 text-2xs text-ink-400 text-center">No countries found</div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={`${country.code}-${country.dialCode}`}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[13px] hover:bg-ink-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <span className="text-base select-none">{country.flag}</span>
                    <span className="font-medium text-ink-800 dark:text-ink-200 grow">{country.name}</span>
                    <span className="text-ink-400 font-mono">+{country.dialCode}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Remainder phone number input field */}
      <div className="flex gap-2">
        <div className="w-20 select-none flex items-center justify-center rounded-md border border-ink-200/80 bg-ink-50/50 px-2.5 py-1.5 text-[13px] font-mono text-ink-500 dark:border-white/10 dark:bg-white/5 dark:text-ink-400">
          +{selectedCountry.dialCode}
        </div>
        <input
          type="text"
          placeholder="e.g. 791584056"
          value={phoneNumberRest}
          onChange={(e) => handlePhoneRestChange(e.target.value)}
          className="input grow font-mono"
          required
          disabled={disabled}
        />
      </div>
    </div>
  );
}
