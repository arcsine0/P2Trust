/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(home)` | `/(home)/` | `/(home)/(transaction)` | `/(home)/(transaction)/info` | `/(home)/info` | `/(tabs)` | `/(tabs)/` | `/(tabs)/(home)` | `/(tabs)/(home)/` | `/(tabs)/(home)/(transaction)` | `/(tabs)/(home)/(transaction)/info` | `/(tabs)/(home)/info` | `/(tabs)/(transaction)` | `/(tabs)/(transaction)/info` | `/(tabs)/history` | `/(tabs)/info` | `/(tabs)/settings` | `/(tabs)\(home)\(transaction)\` | `/(transaction)` | `/(transaction)/info` | `/_sitemap` | `/history` | `/info` | `/settings`;
      DynamicRoutes: `/${Router.SingleRoutePart<T>}` | `/(home)/${Router.SingleRoutePart<T>}` | `/(home)/(transaction)/${Router.SingleRoutePart<T>}` | `/(tabs)/${Router.SingleRoutePart<T>}` | `/(tabs)/(home)/${Router.SingleRoutePart<T>}` | `/(tabs)/(home)/(transaction)/${Router.SingleRoutePart<T>}` | `/(tabs)/(transaction)/${Router.SingleRoutePart<T>}` | `/(tabs)/merchant/${Router.SingleRoutePart<T>}` | `/(tabs)/post/${Router.SingleRoutePart<T>}` | `/(transaction)/${Router.SingleRoutePart<T>}` | `/merchant/${Router.SingleRoutePart<T>}` | `/post/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/(home)/(transaction)/[id]` | `/(home)/[id]` | `/(tabs)/(home)/(transaction)/[id]` | `/(tabs)/(home)/[id]` | `/(tabs)/(transaction)/[id]` | `/(tabs)/[id]` | `/(tabs)/merchant/[id]` | `/(tabs)/post/[id]` | `/(transaction)/[id]` | `/[id]` | `/merchant/[id]` | `/post/[id]`;
    }
  }
}
