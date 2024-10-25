import React, { createContext, useState, useContext, FC, Dispatch, SetStateAction, ReactNode } from 'react';
import { UserData, Interaction, Transaction, Ratings } from "@/lib/helpers/types";

const MerchantContext = createContext<{
    merchantData: UserData | null;
    role: "client" | "merchant";
    interactions: Interaction[] | undefined;
    transactions: Transaction[] | undefined;
    ratings: {
        merchant: Ratings | undefined,
        client: Ratings | undefined,
    } | undefined;
    setMerchantData: Dispatch<SetStateAction<UserData | null>>;
    setRole: Dispatch<SetStateAction<"client" | "merchant">>;
    setInteractions: Dispatch<SetStateAction<Interaction[] | undefined>>;
    setTransactions: Dispatch<SetStateAction<Transaction[] | undefined>>;
    setRatings: Dispatch<SetStateAction<{
        merchant: Ratings | undefined,
        client: Ratings | undefined,
    } | undefined>>;
}>({ 
    merchantData: null, 
    role: "client",
    interactions: [],
    transactions: [],
    ratings: undefined,
    setMerchantData: () => {},
    setRole: () => {},
    setInteractions: () => {},
    setTransactions: () => {},
    setRatings: () => {},
});

export const MerchantProvider: FC<{ children: ReactNode }> = ({ children }) => { 
    const [merchantData, setMerchantData] = useState<UserData | null>(null);
    const [role, setRole] = useState<"client" | "merchant">("client");
    const [interactions, setInteractions] = useState<Interaction[] | undefined>([]);
    const [transactions, setTransactions] = useState<Transaction[] | undefined>([]);
    const [ratings, setRatings] = useState<{
        merchant: Ratings | undefined,
        client: Ratings | undefined,
    } | undefined>(undefined);

    return (
        <MerchantContext.Provider value={{ merchantData, setMerchantData, role, setRole, interactions, setInteractions, transactions, setTransactions, ratings, setRatings }}>
            {children}
        </MerchantContext.Provider>
    );
};

export const useMerchantData = () => {
    const context = useContext(MerchantContext);
    if (context === null) {
        throw new Error('useMerchantData must be used within a MerchantProvider');
    }
    return context;
};