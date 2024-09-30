import React from "react";

import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useTheme, Text, Avatar, Icon } from "react-native-paper";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CurvedBottomBarExpo } from "react-native-curved-bottom-bar";

import { router } from "expo-router";

import { Octicons } from "@expo/vector-icons";

import HomeScreen from "./index";
import HistoryScreen from "./history";
import SettingsScreen from "./settings";

import { useUserData } from "@/lib/context/UserContext";
import { getInitials } from "@/lib/helpers/functions";

export default function TabLayout() {
	const theme = useTheme();
	const { userData } = useUserData();

	const _renderIcon = (routeName: string, selectedTab: string) => {
		let icon: keyof typeof Octicons.glyphMap;

		switch (routeName) {
			case "Home":
				icon = "home";
				break;
			case "History":
				icon = "history";
				break;
			case "Settings":
				icon = "gear";
				break;
			default:
				icon = "info";
				break;
		};

		return (
			<Octicons
				name={icon}
				size={25}
				color={routeName === selectedTab ? theme.colors.primary : "gray"}
			/>
		);
	}

	const renderTabBar = ({ routeName, selectedTab, navigate }: { routeName: string, selectedTab: string, navigate: (routeName: string) => void }) => {
		return (
			<TouchableOpacity
				onPress={() => navigate(routeName)}
				className="flex flex-1 items-center justify-center"
			>
				{_renderIcon(routeName, selectedTab)}
				<Text
					variant="bodySmall"
					className="mt-1"
					style={{
						color: routeName === selectedTab ? theme.colors.primary : "gray",
					}}
				>
					{routeName}
				</Text>
			</TouchableOpacity>
		);
	};

	return (
		<CurvedBottomBarExpo.Navigator
			type="UP"
			height={70}
			circleWidth={50}
			bgColor="white"
			initialRouteName="Home"
			renderCircle={({ routeName, selectedTab, navigate }) => (
				<Animated.View style={{
					width: 60,
					height: 60,
					borderRadius: 30,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "white",
					borderWidth: 2,
					borderColor: theme.colors.primary,
					padding: 10,
					bottom: 20,
				}}>
					<TouchableOpacity
						style={{
							width: 40,
							height: 40,
							borderRadius: 20,
							alignItems: "center",
							justifyContent: "center",
						}}
						onPress={() => router.navigate("/(transactionRoom)/")}
					>
						<Icon
							source="qrcode-scan"
							size={25}
							color={theme.colors.primary}
						/>
					</TouchableOpacity>
				</Animated.View>
			)}
			tabBar={renderTabBar}
		>
			<CurvedBottomBarExpo.Screen
				name="Home"
				position="LEFT"
				component={HomeScreen}
				options={{
					tabBarLabel: "Home",
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
			<CurvedBottomBarExpo.Screen
				name="History"
				component={HistoryScreen}
				position="RIGHT"
				options={{
					tabBarLabel: "History",
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
			{/* <CurvedBottomBarExpo.Screen
					name="Settings"
					component={SettingsScreen}
					position="RIGHT"
					options={{
						tabBarLabel: "Settings",
						headerTitle: () => <Text variant="headlineSmall" className="font-bold">Settings</Text>,
					}}
				/> */}
		</CurvedBottomBarExpo.Navigator>

	);
}