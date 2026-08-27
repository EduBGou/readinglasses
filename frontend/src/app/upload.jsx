import { useState, useEffect } from "react";
import {
  View, Image, Alert, useWindowDimensions, ScrollView, Text, Platform, Pressable, ActivityIndicator
} from "react-native";

import MainActionPressable from "./components/mainActionPressable";
import { COLORS } from "../../constants/colors";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function ImageUploader() {
  const [image, setImage] = useState(null);
  const [resultText, setResultText] = useState(null);
  const [translatedText, setTranslatedText] = useState(null);
  const [loading, setLoading] = useState(false);

  const [rangeStart, setRangeStart] = useState(-1);
  const [selectedIdx, setSelectedIdx] = useState([]);

  const { width, height } = useWindowDimensions();

  const WINDOW_ASPECT_RATIO = width / height
  const IMAGE_CONTAINER_WIDTH = width * 0.8;
  const IMAGE_CONTAINER_HEIGHT = height * 0.7;

  const words = resultText ? resultText.split(/\s+/) : [""];

  const [activeAction, setActiveAction] = useState(null); // "translate" | "askIA" | null

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
      const response = await fetch("http://192.168.18.5:3000/scan", {
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

  const handleWordLongPress = (idx) => {
    setSelectedIdx([])
    setRangeStart(idx)
  }

  const handleWordPress = (idx) => {

    if (selectedIdx.length > 0 && IndexIsInRange(idx)) setSelectedIdx([])

    else if (rangeStart >= 0) {
      setSelectedIdx([Math.min(rangeStart, idx), Math.max(rangeStart, idx) + 1])
      setRangeStart(-1)
    }
    else setSelectedIdx([idx, idx + 1])
  }

  const IndexIsInRange = (idx) => {
    return selectedIdx[0] <= idx && idx < selectedIdx[1]
  }

  const getSelectedString = () => {
    if (selectedIdx.length != 2) return ""
    return words.slice(selectedIdx[0], selectedIdx[1]).join(" ")
  }

  const hasTextSelected = () => { return getSelectedString() !== "" }

  const translate = async () => {
    try {
      setActiveAction("translate");
      let url = `http://192.168.18.5:3000/translate?sl=pt&tl=en&text=${encodeURIComponent(getSelectedString())}`;
      const response = await fetch(url, { method: "GET" });
      const data = await response.json();
      const text = data.translatedText;
      setTranslatedText(text)
    }
    catch {
      console.log("translate error");
    }
  }

  const askIA = () => {
    setActiveAction("askIA");
    console.log("Ask IA pressed")
  }

  useEffect(() => {
    pickImage();
  }, []);

  useEffect(() => {
    if (!hasTextSelected()) setActiveAction(null);
  }, [selectedIdx]);

  return (
    <View className={"flex-1 " + (WINDOW_ASPECT_RATIO < 1 ? "flex-col" : "flex-row")}>
      <View className="flex-1">
        <ScrollView contentContainerClassName="items-center px-6 pt-12 pb-16"
          className="flex h-full flex-1">
          {image && (
            <View className="gap-4 flex-1" style={{ maxWidth: IMAGE_CONTAINER_WIDTH }}>
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
                        alignSelf: "stretch",
                        height: Math.min(IMAGE_CONTAINER_WIDTH * image.height / image.width, IMAGE_CONTAINER_HEIGHT)
                      }}
                    >
                      {resultText ? (
                          <Text className="text-lg text-ink font-medium leading-8 flex flex-wrap m-6" selectable={false}>
                            {words.map((word, idx) =>
                            (
                              <Pressable key={idx} onLongPress={() => handleWordLongPress(idx)}
                                onPress={() => handleWordPress(idx)} className="inline-flex items-baseline">
                                <Text key={idx} className={idx == rangeStart ? "bg-amber" :
                                  (IndexIsInRange(idx) ? "bg-amberSoft" : "")}> {word + " "}</Text>
                              </Pressable>
                            ))}
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

              {resultText && (
                <View className="flex-row items-center justify-center gap-2">
                  <MaterialCommunityIcons
                    name="gesture-tap"
                    size={17}
                    color={COLORS.inkSoft}
                  />

                  <Text className="text-sm text-inkSoft">
                    Toque para selecionar • Pressione e escolha outra palavra
                  </Text>
                </View>
              )}

              {!resultText && (
                <View className="flex-row items-center justify-between">
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

        </ScrollView>
      </View >
      {resultText && (
        <View className={"bg-florest p-4 flex-1 " + (WINDOW_ASPECT_RATIO < 1 ? "max-h-64" : "max-w-96")}>
          <View className="flex flex-row gap-4">
            <MainActionPressable enabled={hasTextSelected()} label="Translate" callableOnPress={translate} active={activeAction === "translate"} />
            <MainActionPressable enabled={hasTextSelected()} label="Ask IA" callableOnPress={askIA} active={activeAction === "askIA"} />
          </View>
          {translatedText && (
            <ScrollView className="flex-1 mt-2">
              <Text className="text-paper text-base font-light">{translatedText}</Text>
            </ScrollView>
          )
          }
        </View>
      )}
    </View >
  )
}
