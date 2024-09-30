import React, { createContext, useContext } from "react";

import { View } from "react-native";
import { CommonActions } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BottomNavigation, useTheme, Text, Avatar } from "react-native-paper";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";

import HomeScreen from "./index";
import HistoryScreen from "./history";
import SettingsScreen from "./settings";

import { useUserData } from "@/lib/context/UserContext";
import { getInitials } from "@/lib/helpers/functions";

type TabParamList = {
	Home: undefined;
	History: undefined;
	Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabLayout() {
	const theme = useTheme();
	const { userData } = useUserData();

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
					headerTitle: "",
					headerLeft: () => (
						<View className="flex flex-row gap-2 ml-2 items-center justify-start">
							{userData ?
								<Avatar.Text label={getInitials(userData.username)} size={30} />
								:
								<Avatar.Text label="N/A" size={30} />
							}
							<View className="flex flex-col items-start justify-center">
								<Text variant="titleMedium" className="font-bold">{userData?.username || "N/A"}</Text>
								<Text variant="bodySmall">ID: 123123</Text>
							</View>
						</View>
					),
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
					headerTitle: "",
					headerLeft: () => (
						<View className="flex flex-row gap-2 ml-2 items-center justify-start">
							{userData ?
								<Avatar.Text label={getInitials(userData.username)} size={30} />
								:
								<Avatar.Text label="N/A" size={30} />
							}
							<View className="flex flex-col items-start justify-center">
								<Text variant="titleMedium" className="font-bold">{userData?.username || "N/A"}</Text>
								<Text variant="bodySmall">ID: 123123</Text>
							</View>
						</View>
					),
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
					headerTitle: () => <Text variant="headlineSmall" className="font-bold">Settings</Text>,
				}}
			/>
		</Tab.Navigator>
	);
}
