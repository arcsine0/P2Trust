import { Stack } from "expo-router";
import { MerchantProvider } from "@/lib/context/MerchantContext";

export default function TransactionLayout() {
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
                    options={{ title: "Transaction Info", headerBackVisible: false }}
                />
                {/* Add more Stack.Screen components for other transaction screens */}
            </Stack>
        </MerchantProvider>
    );
}