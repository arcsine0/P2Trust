import { Stack } from "expo-router";

import { Avatar } from "react-native-paper";
import { View, Text } from "react-native-ui-lib";

import { useUserData } from "@/lib/context/UserContext";
import { MerchantProvider, useMerchantData } from "@/lib/context/MerchantContext";
import { getInitials } from "@/lib/helpers/functions";

export default function TransactionLayout() {
    const { userData } = useUserData();

    return (
        <MerchantProvider>
            <Stack screenOptions={{ headerShown: true }}>
                <Stack.Screen
                    name="index"
                    options={{
                        headerTitle: "",
                        headerLeft: () => (
                            <View className="flex flex-row space-x-2 items-center justify-start">
                                {userData ?
                                    <Avatar.Text label={getInitials(userData.firstname)} size={30} />
                                    :
                                    <Avatar.Text label="N/A" size={30} />
                                }
                                <View className="flex flex-col items-start justify-center">
                                    <Text bodyLarge className="font-bold">{userData?.firstname || "N/A"}</Text>
                                    <Text bodySmall>ID: 123123</Text>
                                </View>
                            </View>
                        ),

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