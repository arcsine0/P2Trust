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
				// tabBarActiveTintColor: "#3b82f6",
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
		// <Tabs
		// 	screenOptions={{
		// 		tabBarActiveTintColor: "#3b82f6",
		// 		tabBarStyle: {
		// 			height: 60,
		// 			paddingVertical: 10,
		// 			borderTopWidth: 2,
		// 			borderTopColor: "#3b82f6",
		// 			shadowRadius: 30
		// 		},
		// 		tabBarLabelStyle: {
		// 			marginBottom: 5
		// 		},
		// 		headerShown: false,
		// 	}}
		// 	>
		// 	<Tabs.Screen
		// 		name="index"
		// 		options={{
		// 			title: "Home",
		// 			tabBarIcon: ({ color, focused }) => (
		// 				<TabBarIcon name="home" color={color} />
		// 			),
		// 		}}
		// 	/>
		// 	<Tabs.Screen
		// 		name="history"
		// 		options={{
		// 			title: "History",
		// 			tabBarIcon: ({ color, focused }) => (
		// 				<TabBarIcon name="history" color={color} />
		// 			),
		// 		}}
		// 	/>
		// 	<Tabs.Screen
		// 		name="(transaction)"
		// 		options={{
		// 			title: "Send",
		// 			tabBarIcon: ({ color, focused }) => (
		// 				<TabBarIcon name="paper-airplane" color={color} />
		// 			),
		// 		}}
		// 	/>
		// 	<Tabs.Screen
		// 		name="link"
		// 		options={{
		// 			title: "Link",
		// 			tabBarIcon: ({ color, focused }) => (
		// 				<TabBarIcon name="credit-card" color={color} />
		// 			),
		// 		}}
		// 	/>
		// 	<Tabs.Screen
		// 		name="settings"
		// 		options={{
		// 			title: "Settings",
		// 			tabBarIcon: ({ color, focused }) => (
		// 				<TabBarIcon name="gear" color={color} />
		// 			),
		// 		}}
		// 	/>
		// </Tabs>
	);
}
