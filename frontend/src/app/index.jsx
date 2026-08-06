import React, { useState } from "react";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View, TextInput } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Link href="/components/upload" asChild>
        <Button title="Butao" />
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
