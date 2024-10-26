import { FC } from "react";
import { router } from "expo-router";
import { ScrollView } from "react-native";

import { Colors, View, Text, Card } from "react-native-ui-lib";

import { UserData, Transaction } from "@/lib/helpers/types";
import { HistoryCard } from "@/components/transactionCards/HistoryCard";

import { useUserData } from "@/lib/context/UserContext";
import { useMerchantData } from "@/lib/context/MerchantContext";

export function MerchantHistory() {
    const { transactions } = useMerchantData();
    const { userData } = useUserData();

    return (
        <ScrollView className="w-full">
            <View className="flex flex-col px-4 pt-4 w-full h-full space-y-2 items-center justify-start">
                <Card
                    style={{ backgroundColor: Colors.bgDefault }}
                    className="flex flex-col w-full p-4 space-y-1 justify-center items-start"
                    elevation={10}
                >
                    <Text bodyLarge className="font-bold">Transaction History</Text>
                    <View className="flex flex-col w-full space-y-2">
                        {userData && transactions && transactions.map((transaction) => (
                            <HistoryCard
                                key={transaction.id}
                                transactionData={transaction}
                                userID={userData.id}
                                elevation={0}
                                onPress={() => router.push(`/transaction/${transaction.id}`)}
                            />
                        ))}
                        {transactions && transactions.length <= 0 && (
                            <View
                                style={{ backgroundColor: Colors.gray200 }}
                                className="flex flex-col w-full px-10 py-20 space-y-1 items-center justify-center rounded-lg"
                            >
                                <Text bodyLarge black className="font-semibold">No Transactions Yet</Text>
                            </View>
                        )}
                    </View>
                </Card>
            </View>
        </ScrollView>
    )
}