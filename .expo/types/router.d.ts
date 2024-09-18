/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(login)` | `/(login)/` | `/(login)/registerIdentifier` | `/(login)/registerPass` | `/(tabs)` | `/(tabs)/` | `/(tabs)/history` | `/(tabs)/settings` | `/(transactionRoom)` | `/(transactionRoom)/` | `/(transactionRoom)/lobby` | `/(transactionRoom)/scan` | `/_sitemap` | `/history` | `/lobby` | `/registerIdentifier` | `/registerPass` | `/scan` | `/settings`;
      DynamicRoutes: `/(transactionRoom)/room/${Router.SingleRoutePart<T>}` | `/merchant/${Router.SingleRoutePart<T>}` | `/room/${Router.SingleRoutePart<T>}` | `/transaction/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/(transactionRoom)/room/[roomID]` | `/merchant/[merchantID]` | `/room/[roomID]` | `/transaction/[transactionID]`;
    }
  }
}
