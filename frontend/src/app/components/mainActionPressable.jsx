import { Pressable, Text } from "react-native";

export default function MainActionPressable({ label, enabled, callableOnPress, active }) {
    return (
        <Pressable
            className={"px-4 rounded-md " + (active? "bg-glass" : "")}
            disabled={!enabled}
            onPress={() => callableOnPress()}
        >
            <Text className="text-lg font-semibold text-paper">{label}</Text>
        </Pressable>
    );
}