import React, { createContext, useState, useContext, FC, Dispatch, SetStateAction, ReactNode } from 'react';
import { UserData } from "@/lib/helpers/types";

const MerchantContext = createContext<{
    merchantData: UserData | null;
    setMerchantData: Dispatch<SetStateAction<UserData | null>>;
}>({ 
    merchantData: null, 
    setMerchantData: () => {} 
});

export const MerchantProvider: FC<{ children: ReactNode }> = ({ children }) => { 
    const [merchantData, setMerchantData] = useState<UserData | null>(null);

    return (
        <MerchantContext.Provider value={{ merchantData, setMerchantData }}>
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