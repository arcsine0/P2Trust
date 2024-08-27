import { Stack } from "expo-router";

export default function LoginLayout() {
    return (
            <Stack screenOptions={{ headerShown: true }}>
                <Stack.Screen
                    name="index"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="registerIdentifier"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="registerPass"
                    options={{ headerShown: false }}
                />
            </Stack>
    );
}