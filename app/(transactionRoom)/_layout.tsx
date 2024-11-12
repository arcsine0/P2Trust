import { Stack, router } from "expo-router";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { Platform } from "react-native";
import { Avatar, IconButton } from "react-native-paper";
import { Colors, View, Text, Button } from "react-native-ui-lib";

import { useUserData } from "@/lib/context/UserContext";
import { MerchantProvider, useMerchantData } from "@/lib/context/MerchantContext";
import { UserCard } from "@/components/userCards/UserCard";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import TransactionHomeScreen from "./index";
import TransactionLobbyScreen from "./room/[roomID]";
import TransactionScanScreen from "./scan";
import TransactionVerifyScreen from "./verify";
import MerchantInfoScreen from "./merchant/[merchantID]";

export default function TransactionLayout() {
    const { userData } = useUserData();

    return (
        <MerchantProvider>
            <Stack screenOptions={{
                headerShown: true,
                // statusBarHidden: Platform.OS === "ios" ? false : true,
            }}
            >
                <Stack.Screen
                    name="index"
                    // component={TransactionHomeScreen}
                    options={{
                        headerTitle: "",
                        header: () => (
                            <View className="flex flex-row mx-4 mt-4 items-center justify-between">
                                <UserCard
                                    idStyle={{ width: "50%" }}
                                    name={userData?.firstname || "N/A"}
                                    id={userData?.id || "123123"}
                                />
                                <View
                                    className="flex flex-row"
                                >
                                    <IconButton
                                        icon="account-plus-outline"
                                        onPress={() => {}}
                                    />

                                    <IconButton
                                        icon="dots-vertical"
                                        onPress={() => {}}
                                    />
                                </View>
                            </View>
                        )
                    }}
                />
                <Stack.Screen
                    name="scan"
                    // component={TransactionScanScreen}
                    options={{
                        headerBackVisible: true,
                        headerTitle: "Scan QR",
                    }}
                />
                <Stack.Screen
                    name="room/[roomID]"
                    // component={TransactionLobbyScreen}
                    options={{
                        headerBackVisible: false,
                        headerTitle: "",

                    }}
                />
                <Stack.Screen
                    name="merchant/[merchantID]"
                    // component={MerchantInfoScreen}
                    options={{
                        headerBackVisible: true,
                        headerTitle: "",

                    }}
                />
                <Stack.Screen
                    name="verify"
                    // component={TransactionVerifyScreen}
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
                <Stack.Screen
                    name="wallet"
                    // component={TransactionVerifyScreen}
                    options={{
                        headerTitle: "Add Wallet to Account",
                        headerTitleAlign: "center",
                        headerShadowVisible: false,
                    }}
                />
            </Stack>
        </MerchantProvider>
    );
}