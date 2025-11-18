import { render, screen } from '@testing-library/react';
import { TripCard } from './TripCard';

const mockTrip = {
  id: '1',
  departureCity: 'New York',
  arrivalCity: 'London',
  departureTime: '10:00',
  arrivalTime: '14:00',
  departureDate: '12/25/24',
  arrivalDate: '12/25/24',
  timezone: 'America/New_York',
  availableKG: 10,
};

describe('TripCard', () => {
  it('renders trip information correctly', () => {
    render(<TripCard trip={mockTrip} />);
    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getAllByText('12/25/24')).toHaveLength(2);
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('14:00')).toBeInTheDocument();
    expect(screen.getByText('10 KG Available')).toBeInTheDocument();
  });

  it('calculates duration correctly', () => {
    render(<TripCard trip={mockTrip} />);
    expect(screen.getByText('4h00m')).toBeInTheDocument();
  });

  it('handles invalid duration', () => {
    const invalidTrip = { ...mockTrip, arrivalTime: '08:00' };
    render(<TripCard trip={invalidTrip} />);
    expect(screen.getByText('Invalid duration')).toBeInTheDocument();
  });
});

describe('parseDateTimeToUTC', () => {
  it('parses valid date and time to UTC', () => {
    const { parseDateTimeToUTC } = require('../lib/utils/dateUtils');
    const result = parseDateTimeToUTC('12/25/24', '10:00', 'America/New_York');
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe('2024-12-25T15:00:00.000Z'); // EST to UTC
  });

  it('normalizes 2-digit year', () => {
    const { parseDateTimeToUTC } = require('../lib/utils/dateUtils');
    const result = parseDateTimeToUTC('12/25/24', '10:00');
    expect(result.getFullYear()).toBe(2024);
  });

  it('throws on invalid date format', () => {
    const { parseDateTimeToUTC } = require('../lib/utils/dateUtils');
    expect(() => parseDateTimeToUTC('abc/def/ghi', '10:00')).toThrow('Invalid date format');
  });

  it('throws on out-of-range month', () => {
    const { parseDateTimeToUTC } = require('../lib/utils/dateUtils');
    expect(() => parseDateTimeToUTC('13/25/24', '10:00')).toThrow('Invalid date');
  });

  it('throws on invalid time', () => {
    const { parseDateTimeToUTC } = require('../lib/utils/dateUtils');
    expect(() => parseDateTimeToUTC('12/25/24', '25:00')).toThrow('Invalid time');
  });

  it('handles timezone conversion', () => {
    const { parseDateTimeToUTC } = require('../lib/utils/dateUtils');
    const result = parseDateTimeToUTC('12/25/24', '10:00', 'UTC');
    expect(result.toISOString()).toBe('2024-12-25T10:00:00.000Z');
  });
});