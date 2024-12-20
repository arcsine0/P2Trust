import { Float } from "react-native/Libraries/Types/CodegenTypes";

export type UserData = {
    id: string;
    created_at: string;
    username: string;
    firstname: string;
    lastname: string;
    push_token: string;
    isVerified: boolean;
    verified_at: Date;
    verifiedID_type: "Passport" | "DriversLicence" | "NationalID";
    verifiedID_number: string;
    wallets: WalletData[] | undefined;
}

export type WalletData = {
    id: string;
    created_at: Date;
    account_name: string;
    account_number: string;
    current_owners?: string[];
    previous_owners?: string[];
    platform: string;
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
    wallets_used: string[];
    timeline: string;
    flags: number;
    flagged_by: string[];
}

export type TransactionListItem = {
    id: string;
    created_at: Date;
    clientName: string;
    total_amount: number;
    status: string;
}

export type Tag = {
    tag: string,
    count: number,
    type: "Positive" | "Negative"
}

export type Ratings = {
    positive: number,
    negative: number,
    total: number,
    tags: Tag[],
    list: Rating[],
}

export type Rating = {
    id: string;
    created_at: Date;
    rating: string;
    tags: string[];
    transaction_id: string;
    target_id: string;
    target_name: string;
    sender_id: string;
    sender_name: string;
    type: string;
}

export type Request = {
    created_at: Date;
    sender_id: string;
    sender_name: string;
    sender_role: string;
}

export type RequestDetails = {
    id?: string;
    amount: number;
    currency?: string;
    platform?: string;
    accountName?: string;
    accountNumber?: string;
    wallet_id?: string | undefined;
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
        sender_id: string;
        from: string;
        data: {
            id: string;
            amount: Float;
            currency: string;
            wallet_id: string;
            platform: string;
            accountName: string;
            accountNumber: string;
            status: "pending" | "completed" | "cancelled" | "confirming";
        };
    }
    | {
        timestamp: Date;
        type: "payment_request_cancelled";
        sender_id: string;
        from: string;
        data: {
            id: string;
        };
    }
    | {
        timestamp: Date;
        type: "payment_sent";
        sender_id: string;
        from: string;
        data: {
            id: string;
            amount: Float;
            currency: string;
            wallet_id: string;
            platform: string;
            receiptURL: string;
            receiptPath: string;
            status: "pending" | "confirmed" | "denied";
        };
    }
    | {
        timestamp: Date;
        type: "payment_confirmed" | "payment_denied";
        sender_id: string;
        from: string;
        data: {
            id: string;
        };
    }
    | {
        timestamp: Date;
        type: "product_sent" | "product_received";
        sender_id: string;
        from: string;
        data: {
            id: string;
        };
    }
    | {
        timestamp: Date;
        type: "message";
        sender_id: string;
        from: string;
        data: {
            message: string;
        };
    }
    | {
        timestamp: Date;
        type: "transaction_started" | "transaction_completed" | "transaction_cancelled",
        from: string;
    };

export type TimelineEvent = {
    timestamp: string;
    type: string;
    from: string;
    recipient?: string | undefined;
    data: {
        id?: string | undefined;
        amount?: number | undefined;
        currency?: string | undefined;
        wallet_id?: string | undefined;
        platform?: string | undefined;
        merchantName?: string | undefined;
        merchantNumber?: string | undefined;
        receiptURL?: string | undefined;
        status?: string | undefined;
    };
}

export type NationalID = {
    DateIssued: string;
    Issuer: string;
    alg: string;
    signature: string;
    subject: {
        BF: string;
        DOB: string;
        PCN: string;
        POB: string;
        Suffix: string;
        fName: string;
        lName: string;
        mName: string;
        sex: string;
    }
}