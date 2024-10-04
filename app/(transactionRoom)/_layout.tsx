import { Stack } from "expo-router";
import { View } from "react-native";

import { Avatar, Button, Text } from "react-native-paper";

import { MerchantProvider, useMerchantData } from "@/lib/context/MerchantContext";
import { getInitials } from "@/lib/helpers/functions";

export default function TransactionLayout() {
    return (
        <MerchantProvider>
            <Stack screenOptions={{ headerShown: true }}>
                <Stack.Screen
                    name="index"
                    options={{
                        headerBackVisible: true,
                        headerTitle: "",
                        
                    }}
                />
                <Stack.Screen
                    name="scan"
                    options={{
                        headerBackVisible: true,
                        headerTitle: "Scan QR",
                        
                    }}
                />
                <Stack.Screen
                    name="room/[roomID]"
                    options={{
                        headerBackVisible: false,
                        headerTitle: "",
                        
                    }}
                />
                <Stack.Screen
                    name="merchant/[merchantID]"
                    options={{
                        headerBackVisible: true,
                        headerTitle: "",
                        
                    }}
                />
            </Stack>
        </MerchantProvider>
    );
}