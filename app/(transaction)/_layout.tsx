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
                        headerLeft: () => (
                            <View className="flex flex-row gap-2 items-center justify-start">
                                {merchantData ?
                                    <Avatar.Text label={getInitials(merchantData.username)} size={30} />

                                : 
                                    <Avatar.Text label="N/A" size={30} />
                                }
                                <Text variant="titleMedium">{merchantData?.username || "N/A"}</Text>
                            </View>
                        ),
                        headerRight: () => (
                            <Button
                                className="rounded-lg"
                                icon="check-all"
                                mode="contained"
                                onPress={() => { }}
                            >
                                Finish
                            </Button>
                        )
                    }}
                />
                {/* Add more Stack.Screen components for other transaction screens */}
            </Stack>
        </MerchantProvider>
    );
}