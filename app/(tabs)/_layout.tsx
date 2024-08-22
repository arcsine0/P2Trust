import React from "react";

import { CommonActions } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BottomNavigation } from "react-native-paper";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";

import HomeScreen  from "./index";
import HistoryScreen from "./history";
import SettingsScreen from "./settings";

const Tab = createBottomTabNavigator();

export default function TabLayout() {
	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
			}}
			tabBar={({ navigation, state, descriptors, insets }) => (
				<BottomNavigation.Bar
					navigationState={state}
					safeAreaInsets={insets}
					onTabPress={({ route, preventDefault }) => {
						const event = navigation.emit({
							type: 'tabPress',
							target: route.key,
							canPreventDefault: true,
						});

						if (event.defaultPrevented) {
							preventDefault();
						} else {
							navigation.dispatch({
								...CommonActions.navigate(route.name, route.params),
								target: state.key,
							});
						}
					}}
					renderIcon={({ route, focused, color }) => {
						const { options } = descriptors[route.key];
						if (options.tabBarIcon) {
							return options.tabBarIcon({ focused, color, size: 24 });
						}

						return null;
					}}
					getLabelText={({ route }) => descriptors[route.key].route.name}
				/>
			)}
		>
			<Tab.Screen
				name="Home"
				component={HomeScreen}
				options={{
					tabBarLabel: 'Home',
					tabBarIcon: ({ color, size }) => {
						return <TabBarIcon name="home" color={color} size={size} />;
					},
				}}
			/>
			<Tab.Screen
				name="History"
				component={HistoryScreen}
				options={{
					tabBarLabel: 'Settings',
					tabBarIcon: ({ color, size }) => {
						return <TabBarIcon name="history" color={color} size={size} />;
					},
				}}
			/>
			<Tab.Screen
				name="Settings"
				component={SettingsScreen}
				options={{
					tabBarLabel: 'Settings',
					tabBarIcon: ({ color, size }) => {
						return <TabBarIcon name="gear" color={color} size={size} />;
					},
				}}
			/>
		</Tab.Navigator>
	);
}
