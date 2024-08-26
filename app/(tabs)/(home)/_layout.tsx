import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { View } from "react-native"
import { Text, IconButton } from "react-native-paper";

import HomeScreen from "./index";
import TransactionLayout from "./(transaction)/_layout";

type HomeParamList = {
    HomeScreen: undefined;
    Transaction: undefined;
}

const Stack = createNativeStackNavigator<HomeParamList>();

export default function HomeScreenLayout() {
    return (
            <Stack.Navigator screenOptions={{ headerShown: true }}>
                <Stack.Screen
                    name="HomeScreen"
                    component={HomeScreen}
                    options={({ navigation }) => ({
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
                <Stack.Screen
                    name="Transaction"
                    component={TransactionLayout}
                    options={{ title: "Transaction Info" }}
                />
                {/* Add more Stack.Screen components for other transaction screens */}
            </Stack.Navigator>
    )
}