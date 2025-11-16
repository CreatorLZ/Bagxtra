'use client';

import DashboardLayout from '@/app/dashboard/DashboardLayout';
import { Plus, Plane } from 'lucide-react';
import { useState } from 'react';
import { useRole } from '@/hooks/useRole';
import { CreateTripModal } from '@/components/CreateTripModal';
import { TripCard } from '@/components/TripCard';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

// --- Data Types ---
interface ApiTrip {
  id: string;
  fromCountry: string;
  toCountry: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  availableCarryOnKg: number;
  availableCheckedKg: number;
  status: string;
}

interface DisplayTrip {
  id: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  availableKG: number;
}

type TripStatus = 'active' | 'pending' | 'completed';

// Fetch trips from API
const fetchTrips = async (getToken: () => Promise<string | null>): Promise<ApiTrip[]> => {
  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const response = await fetch(`${apiUrl}/api/trips`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch trips');
  }
  const result = await response.json();
  return result.data || [];
};

// --- Main Component ---
export default function TripsPage() {
  const { role } = useRole();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<TripStatus>('active');
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);

  // Fetch trips data
  const { data: trips = [], isLoading, error, refetch } = useQuery({
    queryKey: ['trips'],
    queryFn: () => fetchTrips(getToken),
  });

  // Tabs for the Traveler UI
  const tabs: { key: TripStatus; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
  ];

  // Transform API trips to component format
  const transformedTrips: DisplayTrip[] = trips.map((trip: ApiTrip) => ({
    id: trip.id,
    departureCity: trip.fromCountry,
    arrivalCity: trip.toCountry,
    departureTime: trip.departureTime,
    arrivalTime: trip.arrivalTime,
    departureDate: new Date(trip.departureDate).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    }),
    arrivalDate: new Date(trip.arrivalDate).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    }),
    availableKG: trip.availableCarryOnKg + trip.availableCheckedKg,
  }));

  // Group trips by status
  const tripsByStatus = transformedTrips.reduce((acc: Record<TripStatus, DisplayTrip[]>, trip) => {
    // For now, treat all as pending since we don't have status logic yet
    const status: TripStatus = 'pending';
    if (!acc[status]) acc[status] = [];
    acc[status].push(trip);
    return acc;
  }, { active: [], pending: [], completed: [] } as Record<TripStatus, DisplayTrip[]>);

  const currentTrips = tripsByStatus[activeTab] || [];

  // Group trips by month
  const groupedTrips = currentTrips.reduce(
    (acc: Record<string, DisplayTrip[]>, trip) => {
      const date = new Date(trip.departureDate);
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!acc[monthName]) acc[monthName] = [];
      acc[monthName].push(trip);
      return acc;
    },
    {} as Record<string, DisplayTrip[]>
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