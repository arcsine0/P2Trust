import { Stack } from "expo-router";

export default function TransactionLayout() {
    return (
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
                    name="connected"
                    options={{ title: "Transaction Info" }}
                />
                {/* Add more Stack.Screen components for other transaction screens */}
            </Stack>
    );
}