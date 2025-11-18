/**
 * Business rules configuration for BagXtra matching system
 * Centralizes all business logic constants and rules
 */

export const BUSINESS_RULES = {
  // Lead time requirements
  leadTime: {
    // Core rules
    minimumDaysBeforeDeparture: 5,
    bookingCutoffDays: 5,

    // Dynamic lead time calculation based on order complexity
    complexityModifiers: {
      highValueThreshold: 500,      // Items > $500
      highValueExtraDays: 1,
      multiItemThreshold: 3,        // > 3 items
      multiItemExtraDays: 1,
      specializedCategoriesExtraDays: 1
    }
  },

  // Matching and booking
  matching: {
    // Match percentage thresholds
    minimumMatchPercentage: 50,
    excellentMatchThreshold: 90,
    goodMatchThreshold: 70,

    // Result limits
    maxResultsPerSearch: 50,
  },

  // Cooldown and timing
  cooldowns: {
    shopperPaymentCooldownHours: 24,
    travelerPurchaseWindowHours: 24,
    deliveryWindowHours: 24,

    // Reminders
    sendPurchaseReminderAtHoursRemaining: 4,
  },

  // Pricing and fees
  pricing: {
    deliveryFee: 25.00,
    serviceFee: 15.00,
    taxRate: 0.08, // 8%
  },

  // Status flow timing
  statusTiming: {
    // How long before departure to close bookings
    bookingClosureHoursBeforeDeparture: 5 * 24, // 5 days

    // Cron job intervals
    cooldownProcessingIntervalMinutes: 5,
    purchaseDeadlineProcessingIntervalMinutes: 10,
    bookingClosureCheckIntervalHours: 1,
  }
};

/**
 * Calculate required lead time based on order complexity
 */
export function calculateRequiredLeadTime(
  itemCount: number,
  totalValue: number,
  hasSpecialDelivery: boolean
): number {
  let extraDays = 0;

  // High value items need more time
  if (totalValue > BUSINESS_RULES.leadTime.complexityModifiers.highValueThreshold) {
    extraDays += BUSINESS_RULES.leadTime.complexityModifiers.highValueExtraDays;
  }

  // Multiple items need more time
  if (itemCount > BUSINESS_RULES.leadTime.complexityModifiers.multiItemThreshold) {
    extraDays += BUSINESS_RULES.leadTime.complexityModifiers.multiItemExtraDays;
  }

  // Special delivery items need more time
  if (hasSpecialDelivery) {
    extraDays += BUSINESS_RULES.leadTime.complexityModifiers.specializedCategoriesExtraDays;
  }

  return BUSINESS_RULES.leadTime.minimumDaysBeforeDeparture + extraDays;
}

/**
 * Check if a trip departure date meets lead time requirements
 */
export function validateTripLeadTime(
  departureDate: Date,
  complexity?: {
    itemCount?: number;
    totalValue?: number;
    hasSpecialDelivery?: boolean;
  }
): { valid: boolean; requiredDays: number; actualDays: number; message?: string } {
  const now = new Date();
  const daysUntilDeparture = Math.ceil(
    (departureDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const requiredDays = complexity
    ? calculateRequiredLeadTime(
        complexity.itemCount || 1,
        complexity.totalValue || 0,
        complexity.hasSpecialDelivery || false
      )
    : BUSINESS_RULES.leadTime.minimumDaysBeforeDeparture;

  const valid = daysUntilDeparture >= requiredDays;

  const result: { valid: boolean; requiredDays: number; actualDays: number; message?: string } = {
    valid,
    requiredDays,
    actualDays: daysUntilDeparture,
  };

  if (!valid) {
    result.message = `Trip must depart at least ${requiredDays} days from now. Current: ${daysUntilDeparture} days.`;
  }

  return result;
}