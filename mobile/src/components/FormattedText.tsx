import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import type { ThemeTokens } from "../theme";

interface FormattedTextProps {
  content: string;
  theme: ThemeTokens;
  writingDirection?: "rtl" | "ltr";
}

const URL_REGEX = /(https?:\/\/[^\s<>"']+)/g;
const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
];

function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.includes(ext));
}

function extractUrls(
  text: string,
): Array<{ type: "text" | "url" | "image"; content: string }> {
  const result: Array<{ type: "text" | "url" | "image"; content: string }> = [];
  let lastIndex = 0;

  text.replace(URL_REGEX, (url, offset) => {
    if (offset > lastIndex) {
      result.push({ type: "text", content: text.slice(lastIndex, offset) });
    }

    if (isImageUrl(url)) {
      result.push({ type: "image", content: url });
    } else {
      result.push({ type: "url", content: url });
    }

    lastIndex = offset + url.length;
    return url;
  });

  if (lastIndex < text.length) {
    result.push({ type: "text", content: text.slice(lastIndex) });
  }

  return result;
}

export function FormattedText({
  content,
  theme,
  writingDirection,
}: FormattedTextProps) {
  const { colors, spacing, fontSize, fontFamily } = theme;
  const dir = writingDirection ?? "rtl";

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        block: { marginBottom: spacing.xs },
        paragraph: {
          color: colors.foreground,
          fontSize: fontSize.base,
          fontFamily: fontFamily.regular,
          lineHeight: fontSize.base * 1.6,
          marginBottom: spacing.sm,
          textAlign: dir === "rtl" ? "right" : "left",
        },
        bold: { fontFamily: fontFamily.bold, color: colors.foreground },
        h1: {
          color: colors.foreground,
          fontSize: fontSize.xl,
          fontFamily: fontFamily.bold,
          marginTop: spacing.md,
          marginBottom: spacing.sm,
          textAlign: dir === "rtl" ? "right" : "left",
        },
        h2: {
          color: colors.foreground,
          fontSize: fontSize.lg,
          fontFamily: fontFamily.bold,
          marginTop: spacing.md,
          marginBottom: spacing.xs,
          textAlign: dir === "rtl" ? "right" : "left",
        },
        h3: {
          color: colors.foreground,
          fontSize: fontSize.base,
          fontFamily: fontFamily.bold,
          marginTop: spacing.sm,
          marginBottom: spacing.xs,
          textAlign: dir === "rtl" ? "right" : "left",
        },
        listItem: {
          color: colors.foreground,
          fontSize: fontSize.base,
          fontFamily: fontFamily.regular,
          lineHeight: fontSize.base * 1.5,
          marginBottom: spacing.xs,
          paddingLeft: spacing.md,
          textAlign: dir === "rtl" ? "right" : "left",
        },
        listBullet: { marginRight: spacing.sm, color: colors.foreground },
        imageWrapper: {
          marginVertical: spacing.sm,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: colors.muted,
        },
        embeddedImage: {
          width: "100%",
          height: 200,
          borderRadius: 12,
        },
      }),
    [theme, dir],
  );

  if (!content || !content.trim()) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let elementKey = 0;

  lines.forEach((line) => {
    const key = `line-${elementKey++}`;
    if (line.startsWith("### ")) {
      elements.push(
        <Text key={key} style={styles.h3}>
          {line.replace("### ", "")}
        </Text>,
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <Text key={key} style={styles.h2}>
          {line.replace("## ", "")}
        </Text>,
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <Text key={key} style={styles.h1}>
          {line.replace("# ", "")}
        </Text>,
      );
    } else if (line.includes("**")) {
      const parts = line.split("**");
      const textWithBold = parts.map((part, i) =>
        i % 2 === 1 ? (
          <Text key={`bold-${elementKey++}`} style={styles.bold}>
            {part}
          </Text>
        ) : (
          part
        ),
      );
      elements.push(
        <Text key={key} style={styles.paragraph}>
          {textWithBold}
        </Text>,
      );
    } else if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      const urlParts = extractUrls(line.replace(/^[-•]\s+/, ""));
      elements.push(
        <View key={key} style={styles.block}>
          <Text style={styles.listItem}>
            <Text style={styles.listBullet}>• </Text>
            {urlParts.map((p) => {
              if (p.type === "image") {
                return (
                  <Image
                    key={`img-${elementKey++}`}
                    source={{ uri: p.content }}
                    style={styles.embeddedImage}
                    resizeMode="cover"
                  />
                );
              }
              return p.content;
            })}
          </Text>
        </View>,
      );
    } else if (line.trim() === "") {
      elements.push(<View key={key} style={{ height: spacing.sm }} />);
    } else {
      const urlParts = extractUrls(line);
      const hasImages = urlParts.some((p) => p.type === "image");

      if (hasImages) {
        const renderedParts: React.ReactNode[] = [];
        urlParts.forEach((p) => {
          if (p.type === "image") {
            renderedParts.push(
              <View key={`imgwrap-${elementKey++}`} style={styles.imageWrapper}>
                <Image
                  source={{ uri: p.content }}
                  style={styles.embeddedImage}
                  resizeMode="cover"
                  accessibilityLabel="صورة"
                />
              </View>,
            );
          } else if (p.type === "text" && p.content.trim()) {
            renderedParts.push(
              <Text key={`txt-${elementKey++}`}>{p.content}</Text>,
            );
          }
        });

        if (renderedParts.length > 0) {
          elements.push(<View key={key}>{renderedParts}</View>);
        }
      } else {
        elements.push(
          <Text key={key} style={styles.paragraph}>
            {line}
          </Text>,
        );
      }
    }
  });

  return <View style={{ flexDirection: "column" }}>{elements}</View>;
}
