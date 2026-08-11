import "../../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "../../constants/colors";

export default function RootLayout() {
  return (
    <>
      <StatusBar value="default" animated />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.ink,
          },
          headerTintColor: COLORS.paper,
        }}
      />
    </>
  );
}
