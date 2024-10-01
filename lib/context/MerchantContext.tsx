import React, { createContext, useState, useContext, FC, Dispatch, SetStateAction, ReactNode } from 'react';
import { UserData, Interaction } from "@/lib/helpers/types";

const MerchantContext = createContext<{
    merchantData: UserData | null;
    role: "client" | "merchant";
    interactions: Interaction[] | undefined;
    setInteractions: Dispatch<SetStateAction<Interaction[] | undefined>>;
    setMerchantData: Dispatch<SetStateAction<UserData | null>>;
    setRole: Dispatch<SetStateAction<"client" | "merchant">>;
}>({ 
    merchantData: null, 
    role: "client",
    interactions: [],
    setInteractions: () => {},
    setMerchantData: () => {},
    setRole: () => {},
});

export const MerchantProvider: FC<{ children: ReactNode }> = ({ children }) => { 
    const [merchantData, setMerchantData] = useState<UserData | null>(null);
    const [role, setRole] = useState<"client" | "merchant">("client");
    const [interactions, setInteractions] = useState<Interaction[] | undefined>([]);

    return (
        <MerchantContext.Provider value={{ merchantData, setMerchantData, role, setRole, interactions, setInteractions }}>
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