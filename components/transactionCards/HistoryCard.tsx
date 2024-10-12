import { FC } from "react";

import { Icon } from "react-native-paper";
import { Colors, View, Text, Card, Chip } from "react-native-ui-lib";
import { Float } from "react-native/Libraries/Types/CodegenTypes";

import { Transaction } from "@/lib/helpers/types";

import { FontAwesome6 } from "@expo/vector-icons";

interface HistoryCardProps {
    transactionData: Transaction;
    userID: string | undefined
    elevation: number;
    onPress: () => void;
}

export const HistoryCard: FC<HistoryCardProps> = ({ transactionData, userID, elevation, onPress }) => {
    return (
        <Card
            key={transactionData.id}
            style={{ backgroundColor: Colors.bgDefault }}
            onPress={onPress}
            className="flex flex-col p-4 space-y-2"
            elevation={elevation}
        >
            <View className="flex flex-row w-full justify-between items-center">
                <View className="flex flex-row space-x-2 items-center">
                    <FontAwesome6
                        name={"peso-sign"}
                        size={20}
                        color={"#94a3b8"}
                    />
                    <Text h4>{transactionData.total_amount}</Text>
                </View>
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
            <View className="flex flex-row items-center justify-between">
                <View className="flex flex-col items-start justify-center">
                    <View className="flex flex-row space-x-1 items-center">
                        <Icon source="store" size={20} color={Colors.primary700} />
                        {transactionData.merchantID === userID ?
                            <Text body className="font-bold">You (Merchant)</Text>
                            :
                            <Text body className="font-bold">{transactionData.merchantName}</Text>
                        }
                    </View>

                    <View className="flex flex-row space-x-1 items-center">
                        <Icon source="account" size={20} color={Colors.primary700} />
                        {transactionData.clientID === userID ?
                            <Text bodySmall gray400 className="font-semibold">You (Client)</Text>
                            :
                            <Text bodySmall gray400 className="font-semibold">{transactionData.clientName}</Text>
                        }
                    </View>
                </View>
                <View className="flex flex-col items-end justify-start">
                    <Text bodySmall gray400 className="font-semibold">{new Date(transactionData.created_at).toLocaleDateString()}</Text>
                    <Text bodySmall gray400 className="font-semibold">{new Date(transactionData.created_at).toLocaleTimeString()}</Text>
                </View>
            </View>
            <View className="flex flex-row items-center justify-end">
                <Icon source="chevron-right" size={20} color={"#94a3b8"} />
            </View>
        </Card>
    )
}