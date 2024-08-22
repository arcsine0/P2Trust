/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/` | `/(tabs)/(transaction)` | `/(tabs)/(transaction)/` | `/(tabs)/(transaction)/info` | `/(tabs)/history` | `/(tabs)/info` | `/(tabs)/settings` | `/(tabs)\(transaction)\` | `/(tabs)\(transaction)\_layout` | `/(tabs)\(transaction)\info` | `/(tabs)\merchant\[id]` | `/(tabs)\post\[id]` | `/(tabs)\transaction\` | `/(tabs)\transaction\_layout` | `/(tabs)\transaction\info` | `/(transaction)` | `/(transaction)/` | `/(transaction)/info` | `/_sitemap` | `/history` | `/info` | `/settings`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
