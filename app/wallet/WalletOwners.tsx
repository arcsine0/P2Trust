import { FC } from "react";
import { router } from "expo-router";
import { ScrollView } from "react-native";

import { Colors, View, Text, Card } from "react-native-ui-lib";

import { useUserData } from "@/lib/context/UserContext";
import { UserCard } from "@/components/userCards/UserCard";

import { MaterialCommunityIcons } from "@expo/vector-icons";

export function WalletOwners() {
    const { userData, walletData } = useUserData();

    if (userData && walletData && walletData.owners && walletData.owners.current && walletData.owners.previous) return (
        <ScrollView className="w-full">
            <View className="flex flex-col px-4 pt-4 w-full h-full space-y-2 items-center justify-start">
                <Card
                    style={{ backgroundColor: Colors.bgDefault }}
                    className="flex flex-col w-full p-4 space-y-1 justify-center items-start"
                    elevation={10}
                >
                    <Text bodyLarge className="font-bold">Current Wallet Owners</Text>
                    {walletData.owners.current?.length > 0 ?
                        <View className="flex flex-col w-full space-y-2">
                            {walletData.owners.current.map((owner) => (
                                <Card
                                    key={owner.id}
                                    style={{ backgroundColor: Colors.bgDefault }}
                                    onPress={() => router.push(`/(transactionRoom)/merchant/${owner.id}`)}
                                    className="flex flex-col p-4 space-y-2"
                                    elevation={10}
                                >
                                    <UserCard
                                        name={owner.firstname}
                                        id={owner.id}
                                        idStyle={{ width: "75%" }}
                                    />
                                    <View className="flex flex-row w-full space-x-2 items-center justify-end">
                                        <Text caption gray400>See full details</Text>
                                        <MaterialCommunityIcons name="arrow-right" size={15} color={Colors.gray400} />
                                    </View>
                                </Card>
                            ))}
                        </View>
                        :
                        <View
                            className="flex w-full px-2 py-4 space-y-1 items-center justify-center"
                            style={{ backgroundColor: Colors.gray200 }}
                        >
                            <Text bodyLarge black className="font-semibold">No Current Owners Yet</Text>
                            <Text bodySmall black className="text-center">This wallet is not currently owned by any user.</Text>
                        </View>
                    }
                </Card>
                <Card
                    style={{ backgroundColor: Colors.bgDefault }}
                    className="flex flex-col w-full p-4 space-y-1 justify-center items-start"
                    elevation={10}
                >
                    <Text bodyLarge className="font-bold">Past Wallet Owners</Text>
                    {walletData.owners.previous?.length > 0 ?
                        <View className="flex flex-col w-full space-y-2">
                            {walletData.owners.previous.map((owner) => (
                                <Card
                                    key={owner.id}
                                    style={{ backgroundColor: Colors.bgDefault }}
                                    onPress={() => router.push(`/(transactionRoom)/merchant/${owner.id}`)}
                                    className="flex flex-col p-4 space-y-2"
                                    elevation={10}
                                >
                                    <UserCard
                                        name={owner.firstname}
                                        id={owner.id}
                                        idStyle={{ width: "75%" }}
                                    />
                                    <View className="flex flex-row w-full space-x-2 items-center justify-end">
                                        <Text caption gray400>See full details</Text>
                                        <MaterialCommunityIcons name="arrow-right" size={15} color={Colors.gray400} />
                                    </View>
                                </Card>
                            ))}
                        </View>
                        :
                        <View
                            className="flex w-full px-2 py-4 space-y-1 items-center justify-center"
                            style={{ backgroundColor: Colors.gray200 }}
                        >
                            <Text bodyLarge black className="font-semibold">No Recorded Past Owners</Text>
                            <Text bodySmall black className="text-center">We have no records of users that have owned this wallet in the past.</Text>
                        </View>
                    }
                </Card>
            </View>
        </ScrollView>
    )
}