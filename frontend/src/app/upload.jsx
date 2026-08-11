import { useState, useEffect } from "react";
import {
  View, Button, Image, Alert, useWindowDimensions, ScrollView, Text, Platform, Pressable, ActivityIndicator
} from "react-native";

import { COLORS } from "../../constants/colors";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function ImageUploader() {
  const [image, setImage] = useState(null);
  const [resultText, setResultText] = useState(null);
  const [loading, setLoading] = useState(false);

  const { width, height } = useWindowDimensions();

  const IMAGE_CONTAINER_WIDTH = width * 0.7;
  const IMAGE_CONTAINER_HEIGHT = height * 0.7;


  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão negada", "Precisamos de acesso às fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: Platform.OS === "android",
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
      setResultText(null);
    }
  };

  const scanImage = async () => {
    if (!image) return;
    setLoading(true);

    const formData = new FormData();

    if (Platform.OS === "web") {
      const blob = await fetch(image.uri).then((r) => r.blob());

      formData.append("images", blob, image.fileName ?? "upload.jpg");
    } else {
      formData.append("images", {
        uri: image.uri,
        name: image.fileName ?? "upload.jpg",
        type: image.mimeType ?? "image/jpeg",
      });
    }

    formData.append("lang", "por");

    try {
      const response = await fetch("http://10.1.1.125:3000/scan", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Erro", data.error || "Falha ao processar a imagem.");
        return;
      }

      setResultText(data.text);
    } catch (err) {
      Alert.alert("Erro", "Não foi possível conectar ao servidor.");
      console.error("Upload error:", err);
    }
    setLoading(false);
  };

  const rotate = async (quarterTurns) => {
    if (!image) return;

    try {
      const result = await ImageManipulator.manipulateAsync(
        image.uri,
        [{ rotate: quarterTurns * 90 }],
        {
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      setImage(result);
    } catch (error) {
      console.error("Rotation error:", error);
    }
  };

  useEffect(() => {
    pickImage();
  }, []);

  return (
    <View className="flex-1 items-center bg-paperCard px-6 pt-12 pb-16">
      {image && (
        <View className="gap-4" style={{ width: IMAGE_CONTAINER_WIDTH }}>
          <View style={{ height: IMAGE_CONTAINER_HEIGHT, justifyContent: "center" }}>
            <View className="rounded-md shadow-md">
              {loading ? (
                <ActivityIndicator color={COLORS.ink} style={{
                  width: IMAGE_CONTAINER_WIDTH,
                  height: IMAGE_CONTAINER_HEIGHT
                }} />
              ) : (
                <ScrollView
                  className="grow-0 rounded-md border-2 border-florest"
                  showsVerticalScrollIndicator={false}
                  style={{
                    alignSelf: "flex-start",
                    height: Math.min(IMAGE_CONTAINER_WIDTH * image.height / image.width, IMAGE_CONTAINER_HEIGHT)
                  }}
                >
                  {resultText ? (
                    <Text selectable style={{ marginTop: 12 }}>
                      {resultText}
                    </Text>
                  ) : (
                    <Image
                      source={{ uri: image.uri }}
                      style={{
                            width: IMAGE_CONTAINER_WIDTH,
                            height: IMAGE_CONTAINER_WIDTH * image.height / image.width
                          }}
                          resizeMode="contain"
                        />
                    )}

                </ScrollView>)}
            </View>
          </View>

          {!resultText && (
            <View className="flex-row justify-between align-middle">
              <Pressable
                className="bg-transparent px-4 rounded-lg items-center justify-center"
                onPress={() => rotate(-1)}
              >
                <FontAwesome6 name="arrow-rotate-left" size={24} color="black" />
              </Pressable>

              <Pressable
                className={`
                  bg-amber text-ink flex-row items-center rounded-full gap-4 p-4 shadow-sm shadow-amberSoft
                  ${Platform.OS === "web" ? "transition-colors duration-200 hover:bg-amberSoft" :
                    "active:bg-amberSoft"}
                `}
                onPress={scanImage}
                disabled={loading}
              >
                {loading ? (
                  <MaterialCommunityIcons name="cancel" size={18} color={COLORS.ink} />
                ) :
                  <Ionicons name="sparkles-outline" size={18} color={COLORS.ink} />
                }
                <Text className="font-md text-lg">{loading ? "Cancelar" : "Escanear"}</Text>
              </Pressable>

              <Pressable
                className="bg-transparent px-4 rounded-lg items-center justify-center"
                onPress={() => rotate(1)}
              >
                <FontAwesome6 name="arrow-rotate-right" size={24} color="black" />
              </Pressable>
            </View>
          )}

        </View >)}
    </View>)
}
