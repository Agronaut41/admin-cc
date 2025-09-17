declare module 'web-push' {
  interface PushSubscriptionKeys { p256dh: string; auth: string }
  interface PushSubscription { endpoint: string; keys: PushSubscriptionKeys }
  interface SendResult { statusCode: number; body: string }
  interface WebPushStatic {
    setVapidDetails(mailto: string, publicKey: string, privateKey: string): void;
    sendNotification(subscription: PushSubscription, payload?: string, options?: any): Promise<SendResult>;
  }
  const webpush: WebPushStatic;
  export default webpush;
}
