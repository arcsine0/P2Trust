import { FC } from "react";
import { View } from "react-native";
import { Chip, Text } from "react-native-paper";

interface EventChipProps {
    type: string;
    from: string;
}

const EventChip: FC<EventChipProps> = ({ type, from }) => {
    let iconString: string;
    let chipText: string;

    switch (type) {
        case "user_joined":
            iconString = "account-plus";
            chipText = "joined the room"
            break;
        case "user_left":
            iconString = "account-minus";
            chipText = "left the room";
            break
        case "payment_requested":
            iconString = "cash-plus";
            chipText = "has sent a payment request";
            break;
        case "payment_sent":
            iconString = "cash-fast";
            chipText = "has sent the payment";
            break
        case "payment_confirmed":
            iconString = "cash-check";
            chipText = "has confirmed the payment";
            break
        case "payment_denied":
            iconString = "cash-remove";
            chipText = "has denied the payment";
            break
        case "payment_request_cancelled":
            iconString = "cash-refund";
            chipText = "has cancelled the payment request";
            break
        case "product_sent":
            iconString = "store-check";
            chipText = "has sent the product / completed the service";
            break;
        case "product_received":
            iconString = "hand-coin";
            chipText = "has received the product / completed the service";
            break;
        default:
            iconString = "information";
            chipText = "did something";
            break
    }

    return (
        <Chip className="w-full" icon={iconString}>
            <Text>{from} {chipText}</Text>
        </Chip>
    )
}

export default EventChip;