import { Stack, router } from "expo-router";

import { Avatar } from "react-native-paper";
import { Colors, View, Text, Button } from "react-native-ui-lib";

import { useUserData } from "@/lib/context/UserContext";
import { MerchantProvider, useMerchantData } from "@/lib/context/MerchantContext";
import { UserCard } from "@/components/userCards/UserCard";

import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function TransactionLayout() {
    const { userData } = useUserData();

    return (
        <MerchantProvider>
            <Stack screenOptions={{
                headerShown: true,
                statusBarHidden: true,
            }}
            >
                <Stack.Screen
                    name="index"
                    options={{
                        headerTitle: "",
                        headerLeft: () => (
                            <UserCard
                                idStyle={{ width: "50%" }}
                                name={userData?.firstname || "N/A"}
                                id={userData?.id || "123123"}
                            />
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
                <Stack.Screen
                    name="verify"
                    options={{
                        headerBackVisible: false,
                        headerTitle: "ID Verification",
                        headerTitleAlign: "center",
                        headerShadowVisible: false,
                        headerLeft: () => (
                            <Button
                                backgroundColor={Colors.bgDefault}
                                round={true}
                                onPress={() => router.navigate("/(tabs)")}
                            >
                                <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.gray900} />
                            </Button>
                        ),
                    }}
                />
            </Stack>
        </MerchantProvider>
    );
}