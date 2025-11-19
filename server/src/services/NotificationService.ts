import mongoose from 'mongoose';

export interface NotificationData {
  userId: mongoose.Types.ObjectId;
  type: 'email' | 'push' | 'sms';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * SIMULATION: Send notification to user
   * In production, this would integrate with email/SMS/push services
   */
  async sendNotification(notification: NotificationData): Promise<boolean> {
    const { userId, type, title, message, actionUrl, metadata } = notification;

    console.log(`📧 ${type.toUpperCase()} NOTIFICATION:`);
    console.log(`   Title: ${title}`);
    console.log(`   Message: ${message}`);
    if (actionUrl) console.log(`   Action: ${actionUrl}`);
    if (metadata) console.log(`   Metadata:`, metadata);

    // SIMULATION: In production, this would:
    // - Send email via SendGrid/Mailgun
    // - Send SMS via Twilio
    // - Send push via Firebase/OneSignal

    return true; // Mock success
  }

  /**
   * Send booking confirmation notifications
   */
  async sendBookingConfirmation(
    shopperId: mongoose.Types.ObjectId,
    travelerId: mongoose.Types.ObjectId,
    matchId: mongoose.Types.ObjectId,
    cooldownEndsAt: Date,
    userLocale: string = 'en-US'
  ): Promise<void> {
    const cooldownTime = cooldownEndsAt.toLocaleString(userLocale, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    // Notify shopper
    await this.sendNotification({
      userId: shopperId,
      type: 'email',
      title: 'Booking Confirmed - 24 Hour Cancellation Window',
      message: `Your booking has been confirmed! You have until ${cooldownTime} to cancel for a full refund.`,
      actionUrl: `/dashboard/orders/${matchId}`,
      metadata: { matchId, cooldownEndsAt, type: 'booking_confirmation' }
    });

    // Notify traveler
    await this.sendNotification({
      userId: travelerId,
      type: 'email',
      title: 'New Booking - Prepare for Purchase',
      message: `You have a new booking. Purchase deadline: 24 hours after cooldown ends.`,
      actionUrl: `/dashboard/deliveries/${matchId}`,
      metadata: { matchId, type: 'traveler_booking' }
    });
  }

  /**
   * Send purchase deadline reminders
   */
  async sendPurchaseDeadlineReminder(
    travelerId: mongoose.Types.ObjectId,
    matchId: mongoose.Types.ObjectId,
    hoursRemaining: number
  ): Promise<void> {
    await this.sendNotification({
      userId: travelerId,
      type: 'email',
      title: `Purchase Deadline: ${hoursRemaining} Hours Remaining`,
      message: `You have ${hoursRemaining} hours to purchase and upload receipt for your delivery.`,
      actionUrl: `/dashboard/deliveries/${matchId}`,
      metadata: { matchId, hoursRemaining, type: 'purchase_reminder' }
    });
  }

  /**
   * Send purchase deadline missed notification
   */
  async sendPurchaseDeadlineMissed(
    travelerId: mongoose.Types.ObjectId,
    shopperId: mongoose.Types.ObjectId,
    matchId: mongoose.Types.ObjectId
  ): Promise<void> {
    // Notify traveler
    await this.sendNotification({
      userId: travelerId,
      type: 'email',
      title: 'Purchase Deadline Missed - Account Flagged',
      message: 'You missed the purchase deadline. Your account has been flagged. Contact support.',
      actionUrl: '/dashboard/support',
      metadata: { matchId, type: 'deadline_missed_traveler' }
    });

    // Notify shopper
    await this.sendNotification({
      userId: shopperId,
      type: 'email',
      title: 'Delivery Cancelled - Purchase Deadline Missed',
      message: 'The traveler missed the purchase deadline. Your booking has been cancelled with full refund.',
      actionUrl: '/dashboard/orders',
      metadata: { matchId, type: 'deadline_missed_shopper' }
    });
  }

  /**
   * Send delivery PIN notifications
   */
  async sendDeliveryPinGenerated(
    travelerId: mongoose.Types.ObjectId,
    shopperId: mongoose.Types.ObjectId,
    matchId: mongoose.Types.ObjectId,
    pin: string,
    expiresAt: Date
  ): Promise<void> {
    // Notify traveler
    await this.sendNotification({
      userId: travelerId,
      type: 'email',
      title: 'Delivery PIN Generated',
      message: `A PIN has been generated for delivery verification and will be provided to the shopper at pickup. (Expires: ${expiresAt.toISOString()}).`,
      actionUrl: `/dashboard/deliveries/${matchId}`,
      metadata: { matchId, expiresAt, type: 'pin_generated' }
    });

    // Notify shopper
    await this.sendNotification({
      userId: shopperId,
      type: 'email',
      title: 'Delivery PIN Ready for Pickup',
      message: 'Your item is ready for pickup. The traveler will provide a PIN for verification.',
      actionUrl: `/dashboard/orders/${matchId}`,
      metadata: { matchId, type: 'pin_ready' }
    });
  }

  /**
   * Send delivery completion notifications
   */
  async sendDeliveryCompleted(
    travelerId: mongoose.Types.ObjectId,
    shopperId: mongoose.Types.ObjectId,
    matchId: mongoose.Types.ObjectId,
    amount: number
  ): Promise<void> {
    // Notify traveler
    await this.sendNotification({
      userId: travelerId,
      type: 'email',
      title: 'Delivery Completed - Payment Released',
      message: `$${amount.toFixed(2)} has been added to your wallet. Great job!`,
      actionUrl: '/dashboard/wallet',
      metadata: { matchId, amount, type: 'delivery_completed_traveler' }
    });

    // Notify shopper
    await this.sendNotification({
      userId: shopperId,
      type: 'email',
      title: 'Item Received - Order Completed',
      message: 'Your item has been successfully delivered. Thank you for using BagXtra!',
      actionUrl: '/dashboard/orders',
      metadata: { matchId, type: 'delivery_completed_shopper' }
    });
  }

  /**
   * Send trip status update notifications
   */
  async sendTripStatusUpdate(
    travelerId: mongoose.Types.ObjectId,
    tripId: mongoose.Types.ObjectId,
    status: string,
    message: string
  ): Promise<void> {
    await this.sendNotification({
      userId: travelerId,
      type: 'push',
      title: 'Trip Status Update',
      message,
      actionUrl: `/dashboard/trips/${tripId}`,
      metadata: { tripId, status, type: 'trip_update' }
    });
  }

  /**
   * Send error/cancellation notifications
   */
  async sendCancellationNotification(
    userId: mongoose.Types.ObjectId,
    matchId: mongoose.Types.ObjectId,
    reason: string,
    isRefund: boolean = false
  ): Promise<void> {
    const refundText = isRefund ? ' Full refund processed.' : '';

    await this.sendNotification({
      userId,
      type: 'email',
      title: 'Booking Cancelled',
      message: `Your booking has been cancelled. Reason: ${reason}.${refundText}`,
      actionUrl: '/dashboard/orders',
      metadata: { matchId, reason, isRefund, type: 'cancellation' }
    });
  }

  /**
   * Bulk notification for system announcements
   */
  async sendBulkNotification(
    userIds: mongoose.Types.ObjectId[],
    notification: Omit<NotificationData, 'userId'>
  ): Promise<void> {
    const promises = userIds.map(userId =>
      this.sendNotification({ ...notification, userId })
    );

    await Promise.all(promises);
  }

  /**
   * Check notification preferences (simulation)
   */
  async getUserNotificationPreferences(userId: mongoose.Types.ObjectId): Promise<{
    email: boolean;
    push: boolean;
    sms: boolean;
  }> {
    // SIMULATION: In production, fetch from user preferences in database
    return {
      email: true,
      push: true,
      sms: false, // SMS disabled by default due to cost
    };
  }
}