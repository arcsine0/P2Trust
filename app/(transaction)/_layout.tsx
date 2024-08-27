import { Stack } from "expo-router";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TransactionHomeScreen from "./index";
import TransactionConnectedScreen from "./connected";

export default function TransactionLayout() {
    return (
            <Stack screenOptions={{ headerShown: true }}>
                <Stack.Screen
                    name="index"
                    options={{ title: "Start Transaction" }}
                />
                <Stack.Screen
                    name="connected"
                    options={{ title: "Transaction Info" }}
                />
                {/* Add more Stack.Screen components for other transaction screens */}
            </Stack>
    );
}