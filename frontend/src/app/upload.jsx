import { useState, useEffect } from "react";
import {
  View,
  Button,
  Image,
  Alert,
  useWindowDimensions,
  ScrollView,
  Text,
  Platform,
} from "react-native";

import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export default function ImageUploader() {
  const [image, setImage] = useState(null);
  const [resultText, setResultText] = useState(null);
  const [loading, setLoading] = useState(false);

  const { width } = useWindowDimensions();
  const MAX_PREVIEW_WIDTH = Math.min(width * 0.5, 600);

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

  const getPreviewSize = () => {
    if (!image?.width || !image?.height)
      return { width: MAX_PREVIEW_WIDTH, height: MAX_PREVIEW_WIDTH };

    const aspectRatio = image.width / image.height;
    const width = Math.min(image.width, MAX_PREVIEW_WIDTH);
    const height = width / aspectRatio;

    return { width, height };
  };

  const previewSize = image ? getPreviewSize() : null;

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
    <ScrollView contentContainerStyle={{ alignItems: "center", padding: 16 }}>
      {image && previewSize && (
        <>
          <Image
            source={{ uri: image.uri }}
            style={{
              width: previewSize.width,
              height: previewSize.height,
              borderRadius: 8,
            }}
            resizeMode="contain"
          />
          <Button title="Rotacionar +90º" onPress={() => rotate(1)} />
          <Button title="Rotacionar -90º" onPress={() => rotate(-1)} />
        </>
      )}

      {image && (
        <Button
          title={loading ? "Processando..." : "Escanear"}
          onPress={scanImage}
          disabled={loading}
        />
      )}
      {resultText && (
        <Text selectable style={{ marginTop: 12 }}>
          {resultText}
        </Text>
      )}
    </ScrollView>
  );
}
