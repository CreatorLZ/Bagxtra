'use client';

import DashboardLayout from '@/app/dashboard/DashboardLayout';
import { Plus, Plane } from 'lucide-react';
import { useState } from 'react';
import { useRole } from '@/hooks/useRole';
import { CreateTripModal } from '@/components/CreateTripModal'; // Import the new modal
import { TripCard } from '@/components/TripCard';
 // Import the new card component

// --- Data Types ---
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

type TripStatus = 'active' | 'pending' | 'completed';

// --- Mock Data ---
const mockTrips: Trip[] = [
  {
    id: 1,
    departureCity: 'LA',
    arrivalCity: 'LAG',
    departureTime: '10:30 am',
    arrivalTime: '12:40 pm',
    departureDate: '12/05/25',
    arrivalDate: '15/05/25',
    availableKG: 15,
  },
  {
    id: 2,
    departureCity: 'LA',
    arrivalCity: 'LAG',
    departureTime: '10:30 am',
    arrivalTime: '12:40 pm',
    departureDate: '12/03/25',
    arrivalDate: '15/03/25',
    availableKG: 15,
  },
  {
    id: 3,
    departureCity: 'LA',
    arrivalCity: 'LAG',
    departureTime: '10:30 am',
    arrivalTime: '12:40 pm',
    departureDate: '12/03/25',
    arrivalDate: '15/03/25',
    availableKG: 15,
  },
  // Add more mock data for different months/statuses if needed
];

// Group trips by status and then by a mock month for display
const getTripsByStatus = (): Record<TripStatus, Trip[]> => ({
  active: mockTrips.slice(0, 1), // Only one active trip for demo
  pending: mockTrips.slice(0, 3), // Three pending trips for demo
  completed: mockTrips.slice(1, 3), // Two completed trips for demo
});

// --- Main Component ---
export default function TripsPage() {
  const { role } = useRole(); 
  const [activeTab, setActiveTab] = useState<TripStatus>('active');
  const [isTripModalOpen, setIsTripModalOpen] = useState(false); // State for the modal

  // Tabs for the Traveler UI
  const tabs: { key: TripStatus; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
  ];

  const tripsByStatus = getTripsByStatus();
  const currentTrips = tripsByStatus[activeTab] || [];

  // Group trips by month (using hardcoded month logic for demo as in OrdersPage)
  const groupedTrips = currentTrips.reduce(
    (acc: Record<string, Trip[]>, trip, index) => {
      let month = '';
      const date = trip.departureDate.split('/'); // e.g., ['12', '05', '25']
      const monthIndex = parseInt(date[1], 10);

      // Simple mock month grouping logic
      if (monthIndex === 5) month = 'May 2025'; // 05/25 -> May
      else if (monthIndex === 4) month = 'April 2025'; // 04/25 -> April
      else if (monthIndex === 3) month = 'March 2025'; // 03/25 -> March
      else if (index === 0) month = 'April 2025';
      else month = 'March 2025';

      if (!acc[month]) acc[month] = [];
      acc[month].push(trip);
      return acc;
    },
    {}
  );

  // Only Travelers should see this page/data (and the FAB)
  if (role !== 'traveler') {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Traveler Account Required
          </h3>
          <p className="text-gray-600">
            This page is for users who travel and carry items for shoppers.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 font-space-grotesk">Trips</h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-purple-50 text-purple-900 border-purple-900 border'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Trips List */}
        <div className="space-y-6">
          {Object.entries(groupedTrips).map(([month, trips]) => (
            <div key={month}>
              {/* Month Header */}
              <div className="text-sm text-gray-500 mb-3 font-medium">
                {month}
              </div>

              {/* Trips in this month */}
              <div className="space-y-3">
                {trips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </div>
          ))}

          {currentTrips.length === 0 && (
            <div className="text-center py-12">
              <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No trips in this category
              </h3>
              <p className="text-gray-600">
                Your trips will appear here when available.
              </p>
            </div>
          )}
        </div>

        {/* Floating Action Button to add a new trip */}
        <button
          onClick={() => setIsTripModalOpen(true)}
          className="fixed bottom-24 right-8 w-14 h-14 bg-purple-800 hover:bg-purple-900 text-white rounded-2xl shadow-lg flex items-center justify-center transition-colors"
        >
          <Plus className="text-3xl font-light cursor-pointer" />
        </button>
      </div>

      {/* Render the Create Trip Modal */}
      <CreateTripModal
        isOpen={isTripModalOpen}
        onOpenChange={setIsTripModalOpen}
      />
    </DashboardLayout>
  );
}