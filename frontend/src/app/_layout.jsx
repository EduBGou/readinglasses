import { Stack } from 'expo-router';
import { StatusBar } from "expo-status-bar";
import { Colors } from "../../constants/colors"

export default function RootLayout() {
    return (
        <>
            <StatusBar value="auto" animated/>
            <Stack screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.backgroundColor
                },
                headerTintColor: Colors.primaryAction
            }} />
        </>
    )
}