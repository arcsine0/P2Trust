import { FC } from "react";
import { View, ViewStyle } from "react-native";
import { Text, Card, Icon, Button, Chip } from "react-native-paper";

import { FontAwesome6 } from "@expo/vector-icons";

import { Float } from "react-native/Libraries/Types/CodegenTypes";
import { UserData } from "@/lib/helpers/types";

interface PaymentRequestCardProps {
    timestamp: Date;
    userData: UserData | null;
    from: string;
    platform: string;
    currency: string;
    amount: Float;
    onPayment?: () => void;
    style?: ViewStyle;
}

const PaymentRequestCard: FC<PaymentRequestCardProps> = ({ style, userData, timestamp, from, platform, currency, amount, onPayment }) => {
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
                <Card.Content className="flex flex-col space-y-1 p-2" >
                    <View className="flex flex-row items-center justify-between">
                        <View className="flex flex-row space-x-2 items-center justify-start">
                            <Icon source="calendar-blank-outline" size={15} color={"#94a3b8"} />
                            <Text variant="bodyMedium" className="text-slate-400">{timestamp.toLocaleDateString()}</Text>
                        </View>
                        <Chip compact={true}>{platform}</Chip>
                    </View>
                    <Text variant="titleMedium" className="font-bold">Payment Request</Text>
                    <View className="flex flex-row space-x-2 items-center justify-start">
                        <FontAwesome6
                            name={currencySymbol}
                            size={20}
                            color={"#94a3b8"}
                        />
                        <Text variant="titleLarge" className="font-bold">{amount}</Text>
                    </View>
                    <View className="flex flex-row space-x-2 items-center justify-start">
                        <FontAwesome6
                            name="credit-card"
                            size={15}
                            color={"#94a3b8"}
                        />
                        <Text variant="bodyMedium" className="text-slate-400">Pay Via {platform}</Text>
                    </View>
                    {userData.username !== from ?
                        <Button
                            className="rounded-lg w-full"
                            icon={"cash"}
                            mode="contained"
                            onPress={onPayment}
                        >
                            Pay
                        </Button>
                    : null}
                </Card.Content>
            </Card>
        )
    }
}

export default PaymentRequestCard;