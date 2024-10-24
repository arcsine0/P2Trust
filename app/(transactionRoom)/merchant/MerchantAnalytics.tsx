import { FC } from "react";
import { ScrollView } from "react-native";

import { Colors, View, Text, Card, Button, ActionSheet, Dialog, Toast } from "react-native-ui-lib";

import { PieChart, LineChart } from "react-native-gifted-charts";

import { Transaction } from "@/lib/helpers/types";

interface MerchantAnalyticsProps {
    transactionList: Transaction[] | undefined;
}

export const MerchantAnalytics: FC<MerchantAnalyticsProps> = ({ transactionList }) => {
    const renderDot = (size: number, color: string) => (
        <View
            style={{
                height: size,
                width: size,
                borderRadius: 10,
                backgroundColor: color,
            }}

        />
    )

    return (
        <ScrollView className="w-full">
            {transactionList && transactionList.length > 0 ? 
                <View className="flex flex-col px-4 pt-4 w-full h-full space-y-2 items-center justify-start">
                    <Card
                        style={{ backgroundColor: Colors.bgDefault }}
                        className="flex flex-col w-full p-4 space-y-2 justify-center items-start"
                        elevation={10}
                    >
                        <Text bodyLarge className="font-bold">User Analytics</Text>
                        <Text body className="font-bold">Transactions</Text>
                        {transactionList && (
                            <View className="flex flex-row space-x-4 items-center justify-center">
                                <PieChart
                                    data={[
                                        { value: transactionList.filter(transaction => transaction.status === "completed").length, color: Colors.success400 },
                                        { value: transactionList.filter(transaction => transaction.status === "cancelled").length, color: Colors.error400 },
                                    ]}
                                    donut
                                    sectionAutoFocus
                                    radius={70}
                                    innerRadius={45}
                                    innerCircleColor={Colors.bgDefault}
                                    centerLabelComponent={() => (
                                        <View className="flex flex-col space-y-1 items-center justify-center">
                                            <Text h2 className="font-bold">{transactionList.length}</Text>
                                            <Text caption className="font-bold">Total</Text>
                                        </View>
                                    )}
                                />
                                <View className="flex flex-col space-y-2">
                                    <View className="flex flex-row space-x-2 items-center">
                                        {renderDot(10, Colors.success400)}
                                        <Text bodySmall className="font-semibold">Completed</Text>
                                    </View>
                                    <View className="flex flex-row space-x-2 items-center">
                                        {renderDot(10, Colors.error400)}
                                        <Text bodySmall className="font-semibold">Cancelled</Text>
                                    </View>
                                    <View className="flex flex-row space-x-2 items-center">
                                        {renderDot(10, Colors.warning400)}
                                        <Text bodySmall className="font-semibold">Flagged</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                        <Text body className="font-bold">Transaction Volume in PHP</Text>
                        {transactionList && (
                            <LineChart
                                data={transactionList.map(transaction => ({ value: transaction.total_amount, dataPointText: transaction.total_amount.toString() }))}
                                width={250}
                                height={150}
                                color={Colors.primary500}
                                thickness={3}
                                dataPointsColor={Colors.primary700}
                                isAnimated
                                areaChart
                                noOfSections={3}
                                startFillColor={Colors.primary200}
                                hideYAxisText
                                maxValue={Math.max(...transactionList.map(transaction => transaction.total_amount)) + 100}
                                focusEnabled
                            />
                        )}
                        <Text body className="font-bold">Daily Activity</Text>
                        {transactionList && (
                            <LineChart
                                data={transactionList.reduce((acc, transaction) => {
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
                                maxValue={Math.max(...transactionList.reduce((acc, transaction) => {
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
                </View>
            :
                null
            }
            
        </ScrollView>
    )
}