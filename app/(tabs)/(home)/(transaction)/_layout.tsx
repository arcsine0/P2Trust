// import { Stack } from "expo-router";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TransactionHomeScreen from "./index";
import TransactionConnectScreen from "./info";

type TransactionParamList = {
    Index: undefined;
    Info: { id: String };
}

const Stack = createNativeStackNavigator<TransactionParamList>();

export default function TransactionLayout() {
    return (
            <Stack.Navigator screenOptions={{ headerShown: true }}>
                <Stack.Screen
                    name="Index"
                    component={TransactionHomeScreen}
                    options={{ title: "Start Transaction" }}
                />
                <Stack.Screen
                    name="Info"
                    component={TransactionConnectScreen}
                    options={{ title: "Transaction Info" }}
                />
                {/* Add more Stack.Screen components for other transaction screens */}
            </Stack.Navigator>
    );
}