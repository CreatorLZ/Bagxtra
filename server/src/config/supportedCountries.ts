// Supported countries for BagXtra platform
// European & American countries for traveler departures & shopper purchases
export const SHOPPER_BUYING_COUNTRIES = [
  'United States',
  'United Kingdom',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Netherlands',
  'Canada',
  'Ireland',
  'Belgium',
  'Switzerland',
  'Austria',
  'Denmark',
  'Sweden',
  'Norway',
  'Portugal',
  'Finland',
] as const;

// Delivery destinations (Nigeria-focused)
export const DELIVERY_COUNTRIES = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
] as const;

// Traveler departure countries (same as shopper buying)
export const TRAVELER_DEPARTURE_COUNTRIES = SHOPPER_BUYING_COUNTRIES;

// Traveler arrival countries (delivery destinations)
export const TRAVELER_ARRIVAL_COUNTRIES = DELIVERY_COUNTRIES;

// Type definitions for type safety
export type ShopperBuyingCountry = (typeof SHOPPER_BUYING_COUNTRIES)[number];
export type DeliveryCountry = (typeof DELIVERY_COUNTRIES)[number];
export type TravelerDepartureCountry =
  (typeof TRAVELER_DEPARTURE_COUNTRIES)[number];
export type TravelerArrivalCountry =
  (typeof TRAVELER_ARRIVAL_COUNTRIES)[number];

// All supported countries for validation
export const ALL_SUPPORTED_COUNTRIES = [
  ...SHOPPER_BUYING_COUNTRIES,
  ...DELIVERY_COUNTRIES,
] as const;

export type SupportedCountry = (typeof ALL_SUPPORTED_COUNTRIES)[number];
