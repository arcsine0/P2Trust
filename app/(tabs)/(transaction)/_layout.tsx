import { Stack } from "expo-router";

export default function TransactionScreens() {
    return ( 
        <Stack screenOptions={{ headerShown: true }}>
            <Stack.Screen 
                name="index" 
                options={{ title: "Start Transaction" }}  
            />
            <Stack.Screen 
                name="info" 
                options={{ title: "Start Transaction" }}  
            />
        </Stack>
     )
}