import React, { createContext, useState, useContext, FC, Dispatch, SetStateAction, ReactNode } from 'react';
import { UserData, Request, Transaction } from "@/lib/helpers/types";

const UserContext = createContext<{
    userData: UserData | null;
    requests: Request[] | null;
    queue: Request[] | null;
    transactionIDs: string[] | null;

    setRequests: Dispatch<SetStateAction<Request[] | null>>;
    setQueue: Dispatch<SetStateAction<Request[] | null>>;
    setUserData: Dispatch<SetStateAction<UserData | null>>;
    setTransactionIDs: Dispatch<SetStateAction<string[] | null>>;
}>({ 
    userData: null, 
    requests: null, 
    queue: null,
    transactionIDs: null,
    
    setRequests: () => {},
    setQueue: () => {},
    setUserData: () => {},
    setTransactionIDs: () => {},
});

export const UserProvider: FC<{ children: ReactNode }> = ({ children }) => { 
    const [userData, setUserData] = useState<UserData | null>(null);
    const [requests, setRequests] = useState<Request[] | null>(null);
    const [queue, setQueue] = useState<Request[] | null>(null);
    const [transactionIDs, setTransactionIDs] = useState<string[] | null>(null);

    return (
        <UserContext.Provider value={{ userData, setUserData, requests, setRequests, queue, setQueue, transactionIDs, setTransactionIDs }}>
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