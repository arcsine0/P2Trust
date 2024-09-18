import React, { createContext, useState, useContext, FC, Dispatch, SetStateAction, ReactNode } from 'react';
import { UserData } from "@/lib/helpers/types";

const MerchantContext = createContext<{
    merchantData: UserData | null;
    role: "client" | "merchant";
    setMerchantData: Dispatch<SetStateAction<UserData | null>>;
    setRole: Dispatch<SetStateAction<"client" | "merchant">>
}>({ 
    merchantData: null, 
    role: "client",
    setMerchantData: () => {},
    setRole: () => {},
});

export const MerchantProvider: FC<{ children: ReactNode }> = ({ children }) => { 
    const [merchantData, setMerchantData] = useState<UserData | null>(null);
    const [role, setRole] = useState<"client" | "merchant">("client");


    return (
        <MerchantContext.Provider value={{ merchantData, setMerchantData, role, setRole }}>
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