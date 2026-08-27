import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, View, } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Link href="/upload" asChild>
        <Button title="Selecionar Imagem" />
      </Link>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
