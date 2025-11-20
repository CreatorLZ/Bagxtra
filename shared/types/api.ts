export interface CreateShopperRequestPayload {
  fromCountry: string;
  destinationCountry: string;
  deliveryStartDate?: string;
  deliveryEndDate?: string;
  bagItems: BagItemPayload[];
}

export interface BagItemPayload {
  productName: string;
  productLink: string;
  price: number;
  currency: string;
  weightKg: number;
  quantity: number;
  isFragile: boolean;
  photos?: string[];
  requiresSpecialDelivery?: boolean;
  specialDeliveryCategory?: string;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export interface ShopperRequestResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    fromCountry: string;
    toCountry: string;
    status: string;
    priceSummary: {
      totalItemCost: number;
      deliveryFee: number;
      serviceFee: number;
      tax: number;
    };
    bagItemsCount: number;
    createdAt: string;
  };
}

export interface MatchData {
  _id: string;
  matchScore: number;
  travelerName: string;
  travelerAvatar: string | null;
  travelerRating: number;
  flightDetails: {
    from: string;
    to: string;
    departure: string;
    arrival: string;
    duration: string;
    airline: string;
  };
  capacityFit: {
    fitsCarryOn: boolean;
    availableCarryOnKg: number;
    availableCheckedKg: number;
  };
  rationale: string[];
}

export interface ValidationError {
  field: string;
  expected: string;
  received: string;
  message: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: ValidationError[];
}