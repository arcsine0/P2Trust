import { Stack } from "expo-router";
import { View } from "react-native";

import { Avatar, Button, Text } from "react-native-paper";

import { MerchantProvider, useMerchantData } from "@/lib/context/MerchantContext";
import { getInitials } from "@/lib/helpers/functions";

export default function TransactionLayout() {
    const { merchantData } = useMerchantData();

    return (
        <MerchantProvider>
            <Stack screenOptions={{ headerShown: true }}>
                <Stack.Screen
                    name="index"
                    options={{ title: "Start a Transaction" }}
                />
                <Stack.Screen
                    name="scan"
                    options={{ title: "Scan QR" }}
                />
                <Stack.Screen
                    name="lobby"
                    options={{ title: "Merchant Info" }}
                />
                <Stack.Screen
                    name="room/[roomID]"
                    options={{
                        headerBackVisible: false,
                        headerTitle: "",
                        
                    }}
                />
                {/* Add more Stack.Screen components for other transaction screens */}
            </Stack>
        </MerchantProvider>
    );
}