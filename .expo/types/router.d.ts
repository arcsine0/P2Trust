/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(login)` | `/(login)/` | `/(login)/registerIdentifier` | `/(login)/registerPass` | `/(tabs)` | `/(tabs)/` | `/(tabs)/history` | `/(tabs)/settings` | `/(transaction)` | `/(transaction)/` | `/(transaction)/lobby` | `/(transaction)/scan` | `/_sitemap` | `/history` | `/lobby` | `/registerIdentifier` | `/registerPass` | `/scan` | `/settings`;
      DynamicRoutes: `/(tabs)/merchant/${Router.SingleRoutePart<T>}` | `/(tabs)/post/${Router.SingleRoutePart<T>}` | `/(transaction)/room/${Router.SingleRoutePart<T>}` | `/merchant/${Router.SingleRoutePart<T>}` | `/post/${Router.SingleRoutePart<T>}` | `/room/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/(tabs)/merchant/[id]` | `/(tabs)/post/[id]` | `/(transaction)/room/[roomID]` | `/merchant/[id]` | `/post/[id]` | `/room/[roomID]`;
    }
  }
}
