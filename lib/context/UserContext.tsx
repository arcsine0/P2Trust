import React, { createContext, useState, useContext, FC, Dispatch, SetStateAction, ReactNode } from 'react';
import { UserData } from "@/lib/helpers/types";

const UserContext = createContext<{
    userData: UserData | null;
    setUserData: Dispatch<SetStateAction<UserData | null>>;
}>({ 
    userData: null, 
    setUserData: () => {} 
});

export const UserProvider: FC<{ children: ReactNode }> = ({ children }) => { 
    const [userData, setUserData] = useState<UserData | null>(null);

    return (
        <UserContext.Provider value={{ userData, setUserData }}>
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