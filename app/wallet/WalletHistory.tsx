import { FC } from "react";
import { router } from "expo-router";
import { ScrollView } from "react-native";

import { Colors, View, Text, Card } from "react-native-ui-lib";
import { LineChart } from "react-native-gifted-charts";

import { HistoryCard } from "@/components/transactionCards/HistoryCard";

import { useUserData } from "@/lib/context/UserContext";

export function WalletHistory() {
    const { userData, walletData } = useUserData();

    if (userData && walletData) return (
        <ScrollView className="w-full">
            <View className="flex flex-col px-4 pt-4 w-full h-full space-y-2 items-center justify-start">
                <Card
                    style={{ backgroundColor: Colors.bgDefault }}
                    className="flex flex-col w-full p-4 space-y-1 justify-center items-start"
                    elevation={10}
                >
                    <Text bodyLarge className="font-bold">Daily Activity</Text>
                    {walletData.transactions && (
                        <LineChart
                            data={walletData.transactions.reduce((acc, transaction) => {
                                const date = new Date(transaction.created_at).toLocaleDateString();
                                const existingDate = acc.find(item => item.date === date);

                                if (existingDate) {
                                    existingDate.value++;
                                } else {
                                    acc.push({ date, value: 1 });
                                }

                                return acc;
                            }, [] as { date: string, value: number }[]).map(item => ({ value: item.value, dataPointText: item.value.toString() }))}
                            width={250}
                            height={100}
                            color={Colors.primary500}
                            thickness={3}
                            dataPointsColor={Colors.primary700}
                            isAnimated
                            areaChart
                            noOfSections={3}
                            startFillColor={Colors.primary200}
                            hideYAxisText
                            maxValue={Math.max(...walletData.transactions.reduce((acc, transaction) => {
                                const date = new Date(transaction.created_at).toLocaleDateString();
                                const existingDate = acc.find(item => item.date === date);

                                if (existingDate) {
                                    existingDate.value++;
                                } else {
                                    acc.push({ date, value: 1 });
                                }

                                return acc;
                            }, [] as { date: string, value: number }[]).map(item => item.value)) + 2}
                            focusEnabled
                        />
                    )}
                </Card>
                <Card
                    style={{ backgroundColor: Colors.bgDefault }}
                    className="flex flex-col w-full p-4 space-y-1 justify-center items-start"
                    elevation={10}
                >
                    <Text bodyLarge className="font-bold">Recent Wallet Usage</Text>
                    <View className="flex flex-col w-full space-y-2">
                        {userData && walletData.transactions && walletData.transactions.map((transaction) => (
                            <HistoryCard
                                key={transaction.id}
                                transactionData={transaction}
                                userID={userData.id}
                                elevation={0}
                                onPress={() => router.push(`/transaction/${transaction.id}`)}
                            />
                        ))}
                        {walletData.transactions && walletData.transactions.length <= 0 && (
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