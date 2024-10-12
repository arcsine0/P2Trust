import { FC } from "react";

import { Icon, Avatar } from "react-native-paper";
import { Colors, View, Text, Card, Chip } from "react-native-ui-lib";

import { Transaction } from "@/lib/helpers/types";
import { getInitials, formatISODate } from "@/lib/helpers/functions";

interface LiveFeedCardProps {
    transactionData: Transaction;
    elevation: number;
    onPress: () => void;
}

export const LiveFeedCard: FC<LiveFeedCardProps> = ({ transactionData, elevation, onPress }) => {
    return (
        <Card
            onPress={onPress}
            style={{
                backgroundColor: Colors.bgDefault,
                borderBottomWidth: 8,
                borderColor: transactionData.status === "completed" ? Colors.success400 : Colors.error400,
            }}
            elevation={elevation}
            className="flex flex-col p-4 space-y-2"
        >
            {transactionData.flags > 0 && (
                <View className="flex w-1/3">
                    <Chip
                        label={"flagged"}
                        borderRadius={8}
                        backgroundColor={Colors.warning200}
                        containerStyle={{ borderWidth: 0 }}
                    />
                </View>
            )}
            <View className="flex flex-row w-full justify-between items-center">
                <Text bodySmall gray400 className="font-semibold">{formatISODate(transactionData.created_at.toLocaleString())}</Text>
                {transactionData.status === "completed" ?
                    <Chip
                        label={transactionData.status}
                        borderRadius={8}
                        backgroundColor={Colors.success200}
                        containerStyle={{ borderWidth: 0 }}
                    />
                    :
                    <Chip
                        label={transactionData.status}
                        borderRadius={8}
                        backgroundColor={Colors.error200}
                        containerStyle={{ borderWidth: 0 }}
                    />
                }
            </View>
            <View className="flex flex-col space-y-2">
                <View className="flex flex-row space-x-2 items-center justify-start">
                    <Icon source="store" size={20} color={"#60a5fa"} />
                    <Avatar.Text label={getInitials(transactionData.merchantName)} size={20} />
                    <Text body className="font-semibold">{transactionData.merchantName}</Text>
                </View>
                <View className="flex flex-row space-x-2 items-center justify-start">
                    <Icon source="account" size={20} color={"#4ade80"} />
                    <Avatar.Text label={getInitials(transactionData.clientName)} size={20} />
                    <Text body className="font-semibold">{transactionData.clientName}</Text>
                </View>
            </View>
            <View className="flex flex-row items-center justify-between">
                <View className="flex flex-row space-x-2 items-center justify-start">
                    <Text body className="font-semibold text-slate-400">Total Amount:</Text>
                    <Text body className="font-bold">{transactionData.total_amount}</Text>
                </View>
                <Icon source="chevron-right" size={20} color={"#94a3b8"} />
            </View>
        </Card>
    )
}