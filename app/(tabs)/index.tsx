import { Text, View, Image, StyleSheet, Platform } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

export default function HomeScreen() {
	return (
		<View className='flex flex-col w-screen h-screen gap-2 items-center justify-center'>
			<Text className='font-bold text-white'>Home</Text>
		</View>
	);
}
