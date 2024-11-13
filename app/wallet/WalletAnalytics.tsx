import { FC } from "react";
import { ScrollView } from "react-native";

import { Colors, View, Text, Card } from "react-native-ui-lib";

import { PieChart, LineChart } from "react-native-gifted-charts";

import { useUserData } from "@/lib/context/UserContext";

import { MaterialCommunityIcons } from "@expo/vector-icons";

export function WalletAnalytics() {
    const { walletData } = useUserData();

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

    if (walletData && walletData.ratings && walletData.transactions && walletData.insights) return (
        <ScrollView className="w-full">
            <View className="flex flex-col px-4 pt-4 w-full h-full space-y-2 items-center justify-start">
                <Card
                    style={{ backgroundColor: Colors.bgDefault }}
                    className="flex flex-col w-full p-4 space-y-2 justify-center items-start"
                    elevation={10}
                >
                    <Text bodyLarge className="font-bold">Wallet Transactions Ratings</Text>
                    <View className="flex flex-row space-x-4 items-center justify-center">
                        <PieChart
                            data={[
                                { value: walletData.ratings.filter(rating => rating.rating === "UP").length, color: Colors.success400 },
                                { value: walletData.ratings.filter(rating => rating.rating === "DOWN").length, color: Colors.error400 },
                            ]}
                            donut
                            sectionAutoFocus
                            radius={70}
                            innerRadius={45}
                            innerCircleColor={Colors.bgDefault}
                            centerLabelComponent={() => (
                                <View className="flex flex-col space-y-1 items-center justify-center">
                                    <Text h2 className="font-bold">{walletData.ratings?.length || 0}</Text>
                                    <Text caption className="font-bold">Ratings</Text>
                                </View>
                            )}
                        />
                        <View className="flex flex-col space-y-2">
                            <View className="flex flex-row space-x-2 items-center">
                                {renderDot(10, Colors.success400)}
                                <Text bodySmall className="font-semibold">Positive Rating</Text>
                            </View>
                            <View className="flex flex-row space-x-2 items-center">
                                {renderDot(10, Colors.error400)}
                                <Text bodySmall className="font-semibold">Negative Rating</Text>
                            </View>
                        </View>
                    </View>
                </Card>
                <Card
                    style={{ backgroundColor: Colors.bgDefault }}
                    className="flex flex-col w-full p-4 space-y-2 justify-center items-start"
                    elevation={10}
                >
                    <Text bodyLarge className="font-bold">Insights</Text>
                    {walletData.insights.length > 1 ?
                        <View className="flex flex-col w-full space-y-2">
                            {walletData.insights.map((insight, i) => (
                                <View key={i} className="flex flex-row w-full space-x-2 items-center">
                                    <MaterialCommunityIcons 
                                        name="arrow-right"
                                        size={15}
                                        color={Colors.gray900}
                                    />
                                    <Text bodySmall>{insight}</Text>
                                </View>
                            ))}
                        </View>
                        :
                        <View
                            className="flex w-full px-2 py-4 space-y-1 items-center justify-center"
                            style={{ backgroundColor: Colors.gray200 }}
                        >
                            <Text bodyLarge black className="font-semibold">No Notable Insights</Text>
                        </View>
                    }
                </Card>
                <Card
                    style={{ backgroundColor: Colors.bgDefault }}
                    className="flex flex-col w-full p-4 space-y-2 justify-center items-start"
                    elevation={10}
                >
                    <Text bodyLarge className="font-bold">Transaction Volume in PHP</Text>
                    <LineChart
                        data={walletData.transactions.map(transaction => ({ value: transaction.total_amount, dataPointText: transaction.total_amount.toString() }))}
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
                        maxValue={Math.max(...walletData.transactions.map(transaction => transaction.total_amount)) + 100}
                        focusEnabled
                    />
                </Card>
            </View>
        </ScrollView>
    )
}