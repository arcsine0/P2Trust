import { Tabs } from 'expo-router';
import React from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: "#3b82f6",
				tabBarStyle: {
					height: 60,
					paddingVertical: 10,
					borderTopWidth: 2,
					borderTopColor: "#3b82f6",
					shadowRadius: 30
				},
				tabBarLabelStyle: {
					marginBottom: 5
				},
				headerShown: false,
			}}
			>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Home',
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon name="home" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="history"
				options={{
					title: 'History',
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon name="history" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="(transaction)"
				options={{
					title: 'Send',
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon name="paper-airplane" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="link"
				options={{
					title: 'Link',
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon name="credit-card" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: 'Settings',
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon name="gear" color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
