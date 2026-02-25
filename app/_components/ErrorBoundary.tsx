import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { IllustrationPlaceholder } from "./ui/IllustrationPlaceholder";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  title?: string;
  tryAgainLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#FFF8E7",
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
          }}
        >
          <IllustrationPlaceholder scene="error" size={180} />
          <Text
            style={{
              fontSize: 20,
              fontFamily: "Poppins_600SemiBold",
              color: "#2D1B0E",
              textAlign: "center",
              marginTop: 20,
              marginBottom: 8,
            }}
          >
            {this.props.title ?? "Something went wrong"}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Poppins_400Regular",
              color: "#8C7A6D",
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 20,
              paddingHorizontal: 16,
            }}
          >
            {this.state.error.message}
          </Text>
          <Pressable
            onPress={this.handleReset}
            style={{
              backgroundColor: "#E76F51",
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 20,
              shadowColor: "#E76F51",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_600SemiBold", fontSize: 15 }}>
              {this.props.tryAgainLabel ?? "Try again"}
            </Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
