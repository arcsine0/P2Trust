import { FC } from "react";

import { ViewStyle, TouchableOpacity } from "react-native";
import { Colors, View, Text, Card, Marquee, MarqueeDirections } from "react-native-ui-lib";

import { WalletData } from "@/lib/helpers/types";

interface WalletCardProps {
    walletData: WalletData | undefined;

    onPress: () => void;
}

export const WalletCard: FC<WalletCardProps> = ({ walletData, onPress }) => {
    console.log("wallet data: ", walletData)

    return (
        <Card
            onPress={onPress}
            style={{
                backgroundColor: Colors.primary600,
            }}
            elevation={4}
            className="flex flex-col w-full p-4 space-y-2"
        >
            <View className="flex flex-col w-full">
                <Text caption bgDefault>Account Name</Text>
                <Text bodySmall bgDefault className="font-bold">{walletData ? walletData.account_name : "User"}</Text>
            </View>
            <View className="flex flex-col w-full">
                <Text caption bgDefault >Account Number</Text>
                <Text bodySmall bgDefault className="font-bold">{walletData ? walletData.account_number : "123"}</Text>
            </View>
            <View className="flex flex-row w-full justify-end">
                <Text body bgDefault className="font-bold">{walletData ? walletData.platform : "GCash"}</Text>
            </View>
        </Card>
    )
}