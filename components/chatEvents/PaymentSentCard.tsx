import { FC } from "react";
import { View, ViewStyle } from "react-native";
import { Text, Card, Icon, Button, Chip } from "react-native-paper";
import { Image } from "expo-image";

import { FontAwesome6 } from "@expo/vector-icons";

import { Float } from "react-native/Libraries/Types/CodegenTypes";
import { UserData } from "@/lib/helpers/types";
import { getBlobFromSupabase } from "@/lib/helpers/functions"

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
    onDeny?: () => void;
}

const PaymentSentCard: FC<PaymentSentCardProps> = ({ style, id, userData, timestamp, from, platform, currency, status, receiptURL, onConfirm, onDeny }) => {
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
                className="w-2/3"
                style={style}
            >
                <Card.Content className="flex flex-col space-y-1 p-2">
                    <View className="flex flex-row items-center justify-between">
                        <View className="flex flex-row space-x-2 items-center justify-start">
                            <Icon source="calendar-blank-outline" size={15} color={"#94a3b8"} />
                            <Text variant="bodyMedium" className="text-slate-400">{timestamp.toLocaleDateString()}</Text>
                        </View>
                    </View>
                    <Text variant="titleMedium" className="font-bold">Payment Sent</Text>

                    <View className="flex flex-row space-x-2 items-center justify-start">
                        <FontAwesome6
                            name="credit-card"
                            size={15}
                            color={"#94a3b8"}
                        />
                        <Text variant="bodyMedium" className="text-slate-400">Paid Via {platform}</Text>
                    </View>
                    <Text variant="titleSmall" className="font-bold">Proof of Payment</Text>
                    <Image
                        source={{ uri: receiptURL }}
                        contentFit="contain"
                        className="w-full"
                    />
                    {userData.username !== from ?
                        <View className="flex flex-row space-x-2 items-center justify-center">
                            {status !== "denied" && (
                                <Button
                                    className="rounded-lg grow"
                                    icon={"check"}
                                    mode="contained"
                                    onPress={onConfirm}
                                    disabled={status === "confirmed"} 
                                >
                                    {status === "pending" && "Confirm"}
                                    {status === "confirmed" && "Confirmed"}
                                </Button>
                            )}
                            {status !== "confirmed" && (
                                <Button
                                    className="rounded-lg grow"
                                    icon={"close"}
                                    mode="contained"
                                    onPress={onDeny}
                                    disabled={status === "denied"} 
                                >
                                    {status === "pending" && "Deny"}
                                    {status === "denied" && "Denied"}
                                </Button>
                            )}
                        </View>
                        
                    : null}
                </Card.Content>
            </Card>
        )
    }
}

export default PaymentSentCard;