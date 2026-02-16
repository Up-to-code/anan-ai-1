import React, { useMemo, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useThemedTheme, type ThemeTokens } from "../../theme";

interface PropertyImageGalleryProps {
  images: string[];
  theme: ThemeTokens;
  initialIndex?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function PropertyImageGallery({
  images,
  theme,
  initialIndex = 0,
}: PropertyImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const modalFlatListRef = useRef<FlatList>(null);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleScroll = useCallback(
    (event: any) => {
      const contentOffset = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffset / (SCREEN_WIDTH - 48));
      setCurrentIndex(Math.max(0, Math.min(index, images.length - 1)));
    },
    [images.length],
  );

  const openModal = useCallback((index: number) => {
    setModalIndex(index);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  if (images.length === 0) {
    return (
      <View style={styles.placeholder}>
        <Ionicons
          name="image-outline"
          size={48}
          color={theme.colors.mutedForeground}
        />
        <Text style={styles.placeholderText}>لا توجد صور</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.imageWrapper}
            onPress={() => openModal(index)}
            activeOpacity={0.9}
            accessibilityLabel={`صورة ${index + 1} من ${images.length}`}
            accessibilityRole="imagebutton"
          >
            <Image
              source={{ uri: item }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        style={styles.flatList}
      />

      {images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === currentIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}

      <View style={styles.counter}>
        <Text style={styles.counterText}>
          {currentIndex + 1} / {images.length}
        </Text>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
            <Ionicons name="close" size={28} color={theme.colors.foreground} />
          </TouchableOpacity>

          <FlatList
            ref={modalFlatListRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={modalIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            keyExtractor={(item, index) => `modal-${item}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.modalImageWrapper}>
                <Image
                  source={{ uri: item }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              </View>
            )}
          />

          <View style={styles.modalCounter}>
            <Text style={styles.counterText}>
              {modalIndex + 1} / {images.length}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(theme: ThemeTokens) {
  const { colors, radius, spacing, fontSize, fontFamily } = theme;
  return StyleSheet.create({
    container: {
      position: "relative",
    },
    flatList: {
      width: SCREEN_WIDTH - 32,
      height: 220,
    },
    imageWrapper: {
      width: SCREEN_WIDTH - 32,
      height: 220,
      borderRadius: radius.lg,
      overflow: "hidden",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    placeholder: {
      width: SCREEN_WIDTH - 32,
      height: 220,
      borderRadius: radius.lg,
      backgroundColor: colors.muted,
      justifyContent: "center",
      alignItems: "center",
    },
    placeholderText: {
      marginTop: spacing.sm,
      fontSize: fontSize.base,
      color: colors.mutedForeground,
      fontFamily: fontFamily.regular,
    },
    pagination: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
      position: "absolute",
      bottom: spacing.md,
      left: 0,
      right: 0,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.mutedForeground + "60",
    },
    dotActive: {
      backgroundColor: colors.primary,
      width: 18,
    },
    counter: {
      position: "absolute",
      top: spacing.sm,
      end: spacing.sm,
      backgroundColor: colors.card + "CC",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
    },
    counterText: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.medium,
      color: colors.foreground,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background + "F2",
      justifyContent: "center",
    },
    modalClose: {
      position: "absolute",
      top: 60,
      end: spacing.md,
      width: 44,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: colors.card + "CC",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
    modalImageWrapper: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT - 120,
      justifyContent: "center",
      alignItems: "center",
    },
    modalImage: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT - 200,
    },
    modalCounter: {
      position: "absolute",
      bottom: 60,
      left: 0,
      right: 0,
      alignItems: "center",
    },
  });
}
