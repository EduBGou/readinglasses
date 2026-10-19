import { useState, useEffect, useMemo, useRef } from "react";
import {
  View, Image, useWindowDimensions, ScrollView, Text, Platform, Pressable, ActivityIndicator
} from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { File } from "expo-file-system";
import MainActionPressable from "./components/mainActionPressable";
import { COLORS } from "../../constants/colors";
import { FontAwesome6 } from "@expo/vector-icons"; import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const API_URL = `${process.env.EXPO_PUBLIC_BACKEND_HOST}:${process.env.EXPO_PUBLIC_BACKEND_PORT}`;

const RESULT_LABEL = { translate: "Tradução", askIA: "Resposta da IA" };

/* ---------- Small building blocks ---------- */


function IconButton({ onPress, label, disabled, children }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`h-12 w-12 items-center justify-center rounded-full border border-florest/20 bg-white active:bg-amberSoft ${disabled ? "opacity-40" : ""
        }`}
    >
      {children}
    </Pressable>
  );
}

function TextButton({ onPress, icon, label, classname = "" }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-2 rounded-full px-3 py-2 transition-colors duration-200 hover:bg-amberSoft active:bg-amberSoft {className}`"
    >
      <Ionicons name={icon} size={18} color={COLORS.ink} />
      <Text className="text-sm font-medium text-ink">{label}</Text>
    </Pressable>
  );
}

function ErrorBanner({ message, onDismiss }) {
  return (
    <View
      accessibilityRole="alert"
      className="flex-row items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
    >
      <Ionicons name="alert-circle-outline" size={20} color="#991b1b" />
      <Text className="flex-1 text-sm text-red-800">{message}</Text>
      <Pressable onPress={onDismiss} accessibilityLabel="Fechar aviso" hitSlop={10}>
        <Ionicons name="close" size={18} color="#991b1b" />
      </Pressable>
    </View>
  );
}

function EmptyState({ onPick }) {
  return (
    <View className="items-center gap-4 rounded-2xl border border-dashed border-florest/30 bg-white px-6 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-amberSoft">
        <Ionicons name="image-outline" size={30} color={COLORS.ink} />
      </View>
      <View className="items-center gap-1">
        <Text className="text-lg font-semibold text-ink">Nenhuma imagem selecionada</Text>
        <Text className="text-center text-sm text-inkSoft">
          Escolha a foto de um texto para escanear e traduzir.
        </Text>
      </View>
      <Pressable
        onPress={onPick}
        accessibilityRole="button"
        className="rounded-full bg-amber px-6 py-3 active:bg-amberSoft"
      >
        <Text className="text-base font-semibold text-ink">Escolher imagem</Text>
      </Pressable>
    </View>
  );
}

/* ---------- Main component ---------- */
export default function ImageUploader() {
  return (
    <SafeAreaProvider>
      <ImageUploaderContent />
    </SafeAreaProvider>
  )

}
function ImageUploaderContent() {
  const [image, setImage] = useState(null);
  const [resultText, setResultText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [rangeStart, setRangeStart] = useState(-1);
  const [selectedIdx, setSelectedIdx] = useState([]);

  const [activeAction, setActiveAction] = useState(null);
  const [sidebarText, setSidebarText] = useState(null);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [sidebarError, setSidebarError] = useState(null);

  const [boxWidth, setBoxWidth] = useState(0);

  const abortRef = useRef(null);
  const requestRef = useRef(0);

  const { width, height } = useWindowDimensions();
  const isPortrait = width / height < 1;
  const BOX_MAX_HEIGHT = height * 0.62;

  const words = useMemo(() => (resultText ? resultText.trim().split(/\s+/) : []), [resultText]);
  const insets = useSafeAreaInsets();

  const isInRange = (idx) => selectedIdx[0] <= idx && idx < selectedIdx[1];

  const selectedString =
    selectedIdx.length === 2 ? words.slice(selectedIdx[0], selectedIdx[1]).join(" ") : "";
  const hasTextSelected = selectedString !== "";

  const handleWordLongPress = (idx) => {
    setSelectedIdx([]);
    setRangeStart(idx);
  };

  const handleWordPress = (idx) => {
    if (selectedIdx.length > 0 && isInRange(idx)) {
      setSelectedIdx([]);
    } else if (rangeStart >= 0) {
      setSelectedIdx([Math.min(rangeStart, idx), Math.max(rangeStart, idx) + 1]);
      setRangeStart(-1);
    } else {
      setSelectedIdx([idx, idx + 1]);
    }
  };

  const resetReading = () => {
    setResultText(null);
    setSelectedIdx([]);
    setRangeStart(-1);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Precisamos de acesso às suas fotos. Ative a permissão nas configurações do aparelho.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: Platform.OS === "android",
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
      setError(null);
      resetReading();
    }
  };

  const rotate = async (quarterTurns) => {
    if (!image) return;
    try {
      const result = await ImageManipulator.manipulateAsync(
        image.uri,
        [{ rotate: quarterTurns * 90 }],
        { format: ImageManipulator.SaveFormat.JPEG }
      );
      setImage(result);
    } catch (err) {
      console.error("Rotation error:", err);
      setError("Não foi possível girar a imagem.");
    }
  };

  const scanImage = async () => {
    if (!image || loading) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      if (Platform.OS === "web") {
        const blob = await fetch(image.uri).then((r) => r.blob());
        formData.append("images", blob, image.fileName ?? "upload.jpg");
      } else {
        formData.append("images", new File(image.uri));
      }
      formData.append("lang", "por");

      const response = await fetch(`${API_URL}/scan`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Falha ao processar a imagem.");
        return;
      }
      setResultText(data.text);
    } catch (err) {
      if (err?.name === "AbortError") return; // cancelled by the user
      console.error("Upload error:", err);
      setError("Não foi possível conectar ao servidor. Verifique sua conexão e tente de novo.");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const cancelScan = () => abortRef.current?.abort();

  /* ----- sidebar actions ----- */

  const runAction = async (action, request) => {
    const id = ++requestRef.current;
    setActiveAction(action);
    setSidebarLoading(true);
    setSidebarText(null);
    setSidebarError(null);

    try {
      const text = await request();
      if (id === requestRef.current) setSidebarText(text);
    } catch (err) {
      console.log(`${action} error`, err);
      if (id === requestRef.current) {
        setSidebarError("Algo deu errado. Toque no botão para tentar novamente.");
      }
    } finally {
      if (id === requestRef.current) setSidebarLoading(false);
    }
  };

  const translate = () =>
    runAction("translate", async () => {
      const url = `${API_URL}/translate?sl=pt&tl=en&text=${encodeURIComponent(selectedString)}`;
      const response = await fetch(url, { method: "GET" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.translatedText;
    });

  const askIA = () =>
    runAction("askIA", async () => {
      const response = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: selectedString }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.answer;
    });

  /* ----- effects ----- */

  useEffect(() => {
    pickImage();
  }, []);

  // A new selection invalidates whatever the sidebar was showing.
  useEffect(() => {
    requestRef.current++;
    setActiveAction(null);
    setSidebarText(null);
    setSidebarError(null);
    setSidebarLoading(false);
  }, [selectedIdx]);

  /* ----- derived UI ----- */

  const imageHeight =
    image && boxWidth
      ? Math.min((boxWidth * image.height) / image.width, BOX_MAX_HEIGHT)
      : BOX_MAX_HEIGHT;

  const hint =
    rangeStart >= 0
      ? "Agora toque na última palavra do trecho"
      : hasTextSelected
        ? "Toque no trecho selecionado para limpar"
        : "Toque em uma palavra ou segure para marcar um trecho";

  /* ----- render ----- */

  return (
    <View className={"flex-1 bg-paper " + (isPortrait ? "flex-col" : "flex-row")}>
      <View className="flex-1">
        <ScrollView contentContainerClassName="items-center px-5 pb-10 pt-8 grow">
          <View className="w-full max-w-2xl gap-5">
            {image && (
              <View className="flex-row items-center justify-end">
                <TextButton onPress={pickImage} icon="images-outline" label="Trocar imagem" />
              </View>
            )}

            {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

            {!image && <EmptyState onPick={pickImage} />}

            {image && (
              <View
                onLayout={(e) => setBoxWidth(e.nativeEvent.layout.width)}
                className="overflow-hidden rounded-2xl border border-florest/15 bg-white shadow-md"
              >
                {resultText ? (
                  <ScrollView
                    style={{ maxHeight: BOX_MAX_HEIGHT }}
                    contentContainerClassName="p-5"
                    showsVerticalScrollIndicator={false}
                  >
                    <View className="flex-row flex-wrap">
                      {words.map((word, idx) => (
                        <Pressable
                          key={idx}
                          onLongPress={() => handleWordLongPress(idx)}
                          onPress={() => handleWordPress(idx)}
                          accessibilityRole="button"
                          accessibilityLabel={word}
                          accessibilityState={{ selected: isInRange(idx) }}
                          className={
                            "px-[3px] " +
                            (idx === rangeStart ? "bg-amber" : isInRange(idx) ? "bg-amberSoft" : "")
                          }
                        >
                          <Text className="text-lg font-medium leading-8 text-ink" selectable={false}>
                            {word}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                ) : (
                    <View>
                      <Image
                        source={{ uri: image.uri }}
                        style={{ width: "100%", height: imageHeight }}
                        resizeMode="contain"
                        className={loading ? "opacity-30" : ""}
                      />
                      {loading && (
                        <View className="absolute inset-0 items-center justify-center gap-3">
                          <ActivityIndicator size="large" color={COLORS.ink} />
                          <Text className="text-sm font-medium text-ink">Lendo o texto…</Text>
                        </View>
                      )}
                    </View>
                )}
              </View>
            )}

            {/* Controls below the card */}
            {image && !resultText && (
              <View className="flex-row items-center justify-center gap-5">
                <IconButton onPress={() => rotate(-1)} label="Girar para a esquerda" disabled={loading}>
                  <FontAwesome6 name="arrow-rotate-left" size={18} color={COLORS.ink} />
                </IconButton>

                <Pressable
                  onPress={loading ? cancelScan : scanImage}
                  accessibilityRole="button"
                  accessibilityLabel={loading ? "Cancelar escaneamento" : "Escanear imagem"}
                  className={`min-w-40 flex-row items-center justify-center gap-3 rounded-full bg-amber px-7 py-4 shadow-sm active:bg-amberSoft ${Platform.OS === "web" ? "transition-colors duration-200 hover:bg-amberSoft" : ""
                    }`}
                >
                  {loading ? (
                    <MaterialCommunityIcons name="close-circle-outline" size={20} color={COLORS.ink} />
                  ) : (
                    <Ionicons name="sparkles-outline" size={20} color={COLORS.ink} />
                  )}
                  <Text className="text-lg font-semibold text-ink">
                    {loading ? "Cancelar" : "Escanear"}
                  </Text>
                </Pressable>

                <IconButton onPress={() => rotate(1)} label="Girar para a direita" disabled={loading}>
                  <FontAwesome6 name="arrow-rotate-right" size={18} color={COLORS.ink} />
                </IconButton>
              </View>
            )}

            {resultText && (
              <View className="flex-row items-center justify-center gap-2">
                <MaterialCommunityIcons name="gesture-tap" size={17} color={COLORS.inkSoft} />
                <Text className="text-sm text-inkSoft">{hint}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Sidebar / bottom sheet */}
      {resultText && (
        <View
          style={isPortrait ? { paddingBottom: insets.bottom + 20 } : undefined}
          className={
            "gap-4 bg-florest p-5 " +
            (isPortrait ? "rounded-t-3xl" : "w-96 rounded-l-3xl")
          }
        >
          <View className="flex-row gap-3">
            <MainActionPressable
              enabled={hasTextSelected}
              label="Traduzir"
              callableOnPress={translate}
              active={activeAction === "translate"}
            />
            <MainActionPressable
              enabled={hasTextSelected}
              label="Perguntar à IA"
              callableOnPress={askIA}
              active={activeAction === "askIA"}
            />
          </View>

          {!hasTextSelected && (
            <Text className="text-sm leading-6 text-paper/70">
              Selecione uma palavra ou um trecho para traduzir ou perguntar à IA.
            </Text>
          )}

          {hasTextSelected && (
            <Text numberOfLines={2} className="border-l-2 border-amber pl-3 text-sm italic text-paper/80">
              {selectedString}
            </Text>
          )}

          {sidebarLoading && <ActivityIndicator color={COLORS.paper ?? "#fff"} className="self-start" />}

          {sidebarError && <Text className="text-sm text-red-200">{sidebarError}</Text>}

          {sidebarText && (
            <ScrollView className={isPortrait ? "grow-0" : "flex-1"}
              style={isPortrait ? { maxHeight: height * 0.4 } : undefined}
              showsVerticalScrollIndicator={false}>
              <Text className="mb-1 text-sm font-semibold text-amber">
                {RESULT_LABEL[activeAction]}
              </Text>
              <Text className="text-base font-light leading-7 text-paper">{sidebarText}</Text>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}