import React from "react";

import { View } from "react-native";
import { CommonActions } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BottomNavigation, useTheme, Text, IconButton } from "react-native-paper";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";

import HomeScreen from "./index";
import HistoryScreen from "./history";
import SettingsScreen from "./settings";

type TabParamList = {
	Home: undefined;
	History: undefined;
	Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabLayout() {
	const theme = useTheme();

	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: true,
				headerStyle: {
					backgroundColor: theme.colors.surface,
				},
			}}
			tabBar={({ navigation, state, descriptors, insets }) => (
				<BottomNavigation.Bar
					navigationState={state}
					safeAreaInsets={insets}
					onTabPress={({ route, preventDefault }) => {
						const event = navigation.emit({
							type: "tabPress",
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
				options={({ navigation }) => ({
					tabBarLabel: "Settings",
					tabBarIcon: ({ color, size }) => {
						return <TabBarIcon name="home" color={color} size={size} />;
					},
					headerTitle: () => <Text variant="headlineSmall" className="font-semibold">Live Feed</Text>,
					headerRight: () => (
						<View className="flex flex-row">
							<IconButton
								icon="sort-variant"
							/>
							<IconButton
								icon="dots-vertical"
							/>
						</View>
					)
				})}
			/>
			<Tab.Screen
				name="History"
				component={HistoryScreen}
				options={{
					tabBarLabel: "Settings",
					tabBarIcon: ({ color, size }) => {
						return <TabBarIcon name="history" color={color} size={size} />;
					},
					headerTitle: () => <Text variant="headlineSmall" className="font-semibold">History</Text>,
				}}
			/>
			<Tab.Screen
				name="Settings"
				component={SettingsScreen}
				options={{
					tabBarLabel: "Settings",
					tabBarIcon: ({ color, size }) => {
						return <TabBarIcon name="gear" color={color} size={size} />;
					},
					headerTitle: () => <Text variant="headlineSmall" className="font-semibold">Settings</Text>,
				}}
			/>
		</Tab.Navigator>
	);
}
