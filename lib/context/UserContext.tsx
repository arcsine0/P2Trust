import React, { createContext, useState, useContext, FC, Dispatch, SetStateAction, ReactNode } from 'react';
import { UserData, Request, Transaction, WalletData, Rating } from "@/lib/helpers/types";

const UserContext = createContext<{
    userData: UserData | null;
    requests: Request[] | null;
    queue: Request[] | null;
    transactionIDs: string[] | null;
    walletData: {
        wallet: WalletData | null;
        transactions: Transaction[] | null;
        owners: {
            current: UserData[] | null;
            previous: UserData[] | null;
        } | null;
        ratings: Rating[] | null;
        insights: string[] | null;
    } | null;

    setRequests: Dispatch<SetStateAction<Request[] | null>>;
    setQueue: Dispatch<SetStateAction<Request[] | null>>;
    setUserData: Dispatch<SetStateAction<UserData | null>>;
    setTransactionIDs: Dispatch<SetStateAction<string[] | null>>;
    setWalletData: Dispatch<SetStateAction<{
        wallet: WalletData | null;
        transactions: Transaction[] | null;
        owners: {
            current: UserData[] | null;
            previous: UserData[] | null;
        } | null;
        ratings: Rating[] | null;
        insights: string[] | null;
    } | null>>;
}>({ 
    userData: null, 
    requests: null, 
    queue: null,
    transactionIDs: null,
    walletData: {
        wallet: null,
        transactions: null,
        owners: {
            current: null,
            previous: null,
        },
        ratings: null,
        insights: null,
    },
    
    setRequests: () => {},
    setQueue: () => {},
    setUserData: () => {},
    setTransactionIDs: () => {},
    setWalletData: () => {},
});

export const UserProvider: FC<{ children: ReactNode }> = ({ children }) => { 
    const [userData, setUserData] = useState<UserData | null>(null);
    const [requests, setRequests] = useState<Request[] | null>(null);
    const [queue, setQueue] = useState<Request[] | null>(null);
    const [transactionIDs, setTransactionIDs] = useState<string[] | null>(null);
    const [walletData, setWalletData] = useState<{
        wallet: WalletData | null;
        transactions: Transaction[] | null;
        owners: {
            current: UserData[] | null;
            previous: UserData[] | null;
        } | null;
        ratings: Rating[] | null;
        insights: string[] | null;
    } | null>(null);


    return (
        <UserContext.Provider value={{ userData, setUserData, requests, setRequests, queue, setQueue, transactionIDs, setTransactionIDs, walletData, setWalletData }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserData = () => {
    const context = useContext(UserContext);
    if (context === null) {
        throw new Error('useUserData must be used within a UserProvider');
    }
    return context;
};