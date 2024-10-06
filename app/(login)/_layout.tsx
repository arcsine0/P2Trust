import { Stack } from "expo-router";

export default function LoginLayout() {
    return (
            <Stack screenOptions={{ headerShown: true }}>
                <Stack.Screen
                    name="index"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="register"
                    options={{ headerShown: false }}
                />
            </Stack>
    );
}