import { Card } from '@/components/ui/card';
import { Plane } from 'lucide-react';

interface Trip {
  id: number;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  availableKG: number;
}

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  // Calculate approximate duration for the middle display (e.g., 48h10m)
  // NOTE: This is a simplified calculation, a real app would use date/time libraries.
  const calculateDuration = (): string => {
    // Assuming a simple 48h10m for all mock data as per the screenshot
    return '48h10m';
  };

  return (
    <Card className="p-4 shadow-sm rounded-xl cursor-pointer hover:shadow-md transition-shadow w-full lg:max-w-[70vw]">
      <div className="flex flex-col space-y-4">
        {/* Flight Path / Main Details */}
        <div className="flex items-center justify-between text-sm">
          {/* Left Side: Departure */}
          <div className="flex flex-col items-start text-gray-900 font-medium">
            <span className="text-lg font-bold font-space-grotesk">{trip.departureCity}</span>
            <span className="text-xs text-gray-500 font-normal">{trip.departureDate}</span>
            <span className="text-xs text-gray-500 font-normal">{trip.departureTime}</span>
          </div>

          {/* Center: Path & Duration */}
          <div className="flex flex-col items-center flex-1 mx-2 min-w-0">
            {/* Dashed line and Plane icon */}
            <div className="flex items-center w-full relative">
              <div className="flex-1 border-t border-dashed border-gray-400" />
              <Plane className="h-4 w-4 text-purple-800 mx-2 shrink-0" />
              <div className="flex-1 border-t border-dashed border-gray-400" />
            </div>
            {/* Duration */}
            <span className="text-xs text-gray-500 mt-1">
              {calculateDuration()}
            </span>
          </div>

          {/* Right Side: Arrival */}
          <div className="flex flex-col items-end text-gray-900 font-medium">
            <span className="text-lg font-bold font-space-grotesk">{trip.arrivalCity}</span>
            <span className="text-xs text-gray-500 font-normal">{trip.arrivalDate}</span>
            <span className="text-xs text-gray-500 font-normal">{trip.arrivalTime}</span>
          </div>
        </div>

        {/* Available KG Button/Indicator */}
        <div className="flex justify-center pt-2">
          <span className="px-3 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs">
            {trip.availableKG} KG Available
          </span>
        </div>
      </div>
    </Card>
  );
}