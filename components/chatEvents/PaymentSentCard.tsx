import { FC } from "react";
import { ViewStyle } from "react-native";
import { Icon, Chip, ActivityIndicator } from "react-native-paper";
import { Image } from "expo-image";

import { Colors, View, Text, Card, Button } from "react-native-ui-lib";

import { FontAwesome6 } from "@expo/vector-icons";

import { Float } from "react-native/Libraries/Types/CodegenTypes";
import { UserData } from "@/lib/helpers/types";

import { MaterialCommunityIcons } from "@expo/vector-icons";

interface PaymentSentCardProps {
    style?: ViewStyle;
    id: string;
    userData: UserData | null;
    timestamp: Date;
    from: string
    platform?: string;
    currency?: string;
    amount?: Float;
    status: "pending" | "confirmed" | "denied";
    receiptURL: string;
    onConfirm?: () => void;
}

const PaymentSentCard: FC<PaymentSentCardProps> = ({ style, id, userData, timestamp, from, platform, currency, status, receiptURL, onConfirm }) => {
    let currencySymbol;

    switch (currency) {
        case "PHP": currencySymbol = "peso-sign"; break;
        case "USD": currencySymbol = "dollar-sign"; break;
        case "EUR": currencySymbol = "euro-sign"; break;
        default: currencySymbol = "dollar-sign"; break;
    }

    if (userData) {
        return (
            <Card
                style={{ backgroundColor: Colors.bgDefault }}
                className="flex flex-col w-2/3 space-y-1 p-4"
                elevation={10}
            >
                <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row space-x-2 items-center justify-start">
                        <Icon source="calendar-blank-outline" size={15} color={"#94a3b8"} />
                        <Text bodySmall gray400>{timestamp.toLocaleDateString()}</Text>
                    </View>
                </View>
                <Text bodyLarge className="font-bold">Payment Sent</Text>

                <View className="flex flex-row space-x-2 items-center justify-start">
                    <FontAwesome6
                        name="credit-card"
                        size={15}
                        color={"#94a3b8"}
                    />
                    <Text bodySmall gray400>Paid Via {platform}</Text>
                </View>
                <Text bodyLarge className="font-bold">Proof of Payment</Text>
                <Image
                    source={{ uri: receiptURL }}
                    contentFit="contain"
                    className="w-full"
                />
                {userData.username !== from ?
                    <Button
                        className="rounded-lg flex-1"
                        disabled={status !== "pending"}
                        onPress={onConfirm}
                    >
                        {status === "pending" ?
                            <View className="flex flex-row space-x-2 items-center">
                                <MaterialCommunityIcons name="check" size={20} color={"white"} />
                                <Text buttonSmall white>Confirm</Text>
                            </View>
                            :
                            <Text buttonSmall white>
                                {status === "confirmed" && "Confirmed"}
                                {status === "denied" && "Denied"}
                            </Text>
                        }
                    </Button>

                    : null}
            </Card>
        )
    }
}

export default PaymentSentCard;