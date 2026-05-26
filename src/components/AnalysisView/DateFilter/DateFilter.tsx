import { useState, useEffect, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import type { DateFilter } from '../../../utils/dateFilter';
import './DateFilter.css';

registerLocale('ru', ru);

interface DateFilterProps {
  value: DateFilter;
  onChange: (filter: DateFilter) => void;
  availableRange?: { min: string; max: string } | null;
}

const parseDate = (dateStr: string | undefined): Date | undefined => {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? undefined : d;
};

const rangesEqual = (
  a: { from: string; to: string } | null,
  b: { from: string; to: string } | null
) => {
  if (!a || !b) return a === b;
  return a.from === b.from && a.to === b.to;
};

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

export default function DateFilter({ value, onChange, availableRange }: DateFilterProps) {
  const [startDate, setStartDate] = useState<Date | null>(
    availableRange?.min ? new Date(availableRange.min) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    availableRange?.max ? new Date(availableRange.max) : null
  );
  
  const appliedRangeRef = useRef<{ from: string; to: string } | null>(null);
  const isUserChangingRef = useRef(false);

  useEffect(() => {
    if (availableRange?.min && availableRange?.max) {
      const from = new Date(availableRange.min);
      const to = new Date(availableRange.max);
      
      if (!startDate || from.getTime() !== startDate.getTime() ||
          !endDate || to.getTime() !== endDate.getTime()) {
        
        isUserChangingRef.current = false;
        setStartDate(from);
        setEndDate(to);
        appliedRangeRef.current = { from: availableRange.min, to: availableRange.max };
        
        onChange({ 
          enabled: true, 
          range: { from: availableRange.min, to: availableRange.max }
        });
      }
    }
  }, [availableRange?.min, availableRange?.max]);

  useEffect(() => {
    if (isUserChangingRef.current) {
      isUserChangingRef.current = false;
      return;
    }
    
    if (value.range?.from && value.range?.to) {
      const from = new Date(value.range.from);
      const to = new Date(value.range.to);
      
      if (!startDate || from.getTime() !== startDate.getTime() ||
          !endDate || to.getTime() !== endDate.getTime()) {
        setStartDate(from);
        setEndDate(to);
        appliedRangeRef.current = { from: value.range.from, to: value.range.to };
      }
    }
  }, [value.range?.from, value.range?.to]);

  const applyFilter = (newStart: Date | null, newEnd: Date | null) => {
    if (!newStart || !newEnd) return;
    
    const from = formatDate(newStart);
    const to = formatDate(newEnd);
    const newRange = { from, to };
    
    if (!rangesEqual(appliedRangeRef.current, newRange)) {
      appliedRangeRef.current = newRange;
      isUserChangingRef.current = true;
      onChange({ enabled: true, range: newRange });
    }
  };

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    applyFilter(date, endDate);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    applyFilter(startDate, date);
  };

  const handleReset = () => {
    if (availableRange?.min && availableRange?.max) {
      const from = new Date(availableRange.min);
      const to = new Date(availableRange.max);
      
      setStartDate(from);
      setEndDate(to);
      appliedRangeRef.current = { from: availableRange.min, to: availableRange.max };
      isUserChangingRef.current = true;
      
      onChange({ 
        enabled: true, 
        range: { from: availableRange.min, to: availableRange.max }
      });
    }
  };

  const minDate = parseDate(availableRange?.min);
  const maxDate = parseDate(availableRange?.max);

  return (
    <div className="date-filter">
      <div className="date-filter__custom">
        <DatePicker
          selected={startDate}
          onChange={handleStartDateChange}
          selectsStart
          startDate={startDate || undefined}
          endDate={endDate || undefined}
          minDate={minDate}
          maxDate={endDate || maxDate}
          dateFormat="dd.MM.yyyy"
          locale="ru"
          className="date-filter__input"
          placeholderText="От"
          isClearable={false}
          showPopperArrow={false}
          popperPlacement="bottom"
          popperClassName="date-filter__popper"
        />

        <DatePicker
          selected={endDate}
          onChange={handleEndDateChange}
          selectsEnd
          startDate={startDate || undefined}
          endDate={endDate || undefined}
          minDate={startDate || minDate}
          maxDate={maxDate}
          dateFormat="dd.MM.yyyy"
          locale="ru"
          className="date-filter__input"
          placeholderText="До"
          isClearable={false}
          showPopperArrow={false}
          popperPlacement="bottom"
          popperClassName="date-filter__popper"
        />
      </div>
      
      <button 
        className="param-reset-btn"
        onClick={handleReset} 
        type="button"
        title="Сбросить к диапазону продукта"
      >
        ↺
      </button>
      
      {!availableRange?.min && (
        <span className="date-filter__placeholder">Выберите номенклатуру</span>
      )}
    </div>
  );
}