import React from "react";

import { TouchableOpacity, Animated } from "react-native";
import { useTheme, Avatar, Icon } from "react-native-paper";

import { View, Text, Colors } from "react-native-ui-lib";

import { CurvedBottomBarExpo } from "react-native-curved-bottom-bar";

import { router } from "expo-router";

import { Octicons } from "@expo/vector-icons";

import HomeScreen from "./index";
import HistoryScreen from "./history";

import { useUserData } from "@/lib/context/UserContext";

import { UserCard } from "@/components/userCards/UserCard";

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
				color={routeName === selectedTab ? Colors.primary700 : Colors.gray400 }
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
					bodySmall
					className="mt-1"
					style={{
						color: routeName === selectedTab ? Colors.primary700 : Colors.gray400,
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
			bgColor={Colors.bgDefault}
			borderWidth={2}
			borderColor={Colors.gray200}
			initialRouteName="Home"
			renderCircle={() => (
				<Animated.View style={{
					width: 60,
					height: 60,
					borderRadius: 30,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "white",
					borderWidth: 2,
					borderColor: Colors.primary700,
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
							color={Colors.primary700}
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
						<UserCard 
							style={{ marginLeft: 8 }}
							idStyle={{ width: "50%" }}
							name={userData?.firstname || "N/A"}
							id={userData?.id || "123123"}
						/>
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
						<UserCard 
							style={{ marginLeft: 8 }}
							idStyle={{ width: "75%" }}
							name={userData?.firstname || "N/A"}
							id={"123123"}
						/>
					),
				}}
			/>
		</CurvedBottomBarExpo.Navigator>

	);
}