/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/` | `/(tabs)/history` | `/(tabs)/settings` | `/(transaction)` | `/(transaction)/` | `/(transaction)/connected` | `/(transaction)/scan` | `/_sitemap` | `/connected` | `/history` | `/scan` | `/settings`;
      DynamicRoutes: `/(tabs)/merchant/${Router.SingleRoutePart<T>}` | `/(tabs)/post/${Router.SingleRoutePart<T>}` | `/merchant/${Router.SingleRoutePart<T>}` | `/post/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/(tabs)/merchant/[id]` | `/(tabs)/post/[id]` | `/merchant/[id]` | `/post/[id]`;
    }
  }
}
