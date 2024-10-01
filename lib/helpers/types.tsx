import { Float } from "react-native/Libraries/Types/CodegenTypes";

export type UserData = {
	id: string;
	username: string;
	push_token: string;
	[key: string]: any;
}

export type RoomData = {
    id: string;
    [key: string]: any;
}

export type Transaction = {
	id: string;
	created_at: Date;
	merchantID: string;
    merchantName: string;
	clientID: string;
	clientName: string;
	total_amount: number;
	status: string;
    platforms: string[];
    timeline: string;
}

export type TransactionListItem = {
    id: string;
    created_at: Date;
    clientName: string;
    total_amount: number;
    status: string;
}

export type Request = {
    created_at: Date;
    sender_id: string;
    sender_name: string;
}

export type RequestDetails = {
    id?: string;
    amount: number;
	currency?: string;
	platform?: string;
	accountNumber?: string;
	accountName?: string;
}

export type Interaction =
| {
    timestamp: Date;
    type: "user_joined" | "user_left" | "user_disconnected" | "user_reconnected";
    from: string;
}
| {
    timestamp: Date;
    type: "payment_requested";
    from: string;
    data: {
        id: string;
        amount: Float;
        currency: string;
        platform: string;
        accountName: string;
        accountNumber: string;
        status: "pending" | "completed" | "cancelled";
    };
}
| {
    timestamp: Date;
    type: "payment_request_cancelled";
    from: string;
    data: {
        id: string;
    };
}
| {
    timestamp: Date;
    type: "payment_sent";
    from: string;
    data: {
        id: string;
        receipt: string;
        status: "pending" | "confirmed" | "denied";
    };
}
| {
    timestamp: Date;
    type: "payment_confirmed" | "payment_denied";
    from: string;
    data: {
        id: string;
    };
}
| {
    timestamp: Date;
    type: "product_sent" | "product_received";
    from: string;
    data: {
        id: string;
    };
}
| {
    timestamp: Date;
    type: "message";
    from: string;
    data: {
        message: string;
    };
}
| {
    timestamp: Date;
    type: "transaction";
    from: string;
    data: {
        type: "transaction_started" | "transaction_completed" | "transaction_cancelled",
    };
};

export type TimelineEvent = {
    timestamp: string;
    type: string;
    from: string;
    data: {
        amount?: number | null;
        currency?: string | null;
        platform?: string | null;
        merchantName?: string | null;
        merchantNumber?: string | null;
    };
}