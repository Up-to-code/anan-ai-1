/**
 * Article-style block for assistant messages (card + formatted text + optional structured data).
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { FormattedText } from "./FormattedText";
import { getWritingDirection } from "../lib/direction";
import type { ChatMessage } from "../lib/chat-types";
import type { ThemeTokens } from "../theme";

interface ArticleMessageProps {
  message: ChatMessage;
  theme: ThemeTokens;
  renderStructuredBlock?: (type: ChatMessage["type"], data: unknown) => React.ReactNode;
}

export function ArticleMessage({ message, theme, renderStructuredBlock }: ArticleMessageProps) {
  const { spacing } = theme;
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: "100%",
          marginVertical: spacing.xs,
        },
        textBlock: {
          paddingVertical: spacing.sm,
        },
        structuredBlock: {
          marginTop: spacing.md,
        },
      }),
    [theme]
  );

  const writingDirection = getWritingDirection(message.content);

  return (
    <View style={styles.container}>
      {message.content ? (
        <View style={styles.textBlock}>
          <FormattedText
            content={message.content}
            theme={theme}
            writingDirection={writingDirection}
          />
        </View>
      ) : null}
      {message.type !== "text" && message.data != null && renderStructuredBlock ? (
        <View style={styles.structuredBlock}>
          {renderStructuredBlock(message.type, message.data)}
        </View>
      ) : null}
    </View>
  );
}
