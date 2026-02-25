/**
 * Base fallback for AppLottie - re-exports native implementation.
 * Web uses AppLottie.web.tsx, native uses AppLottie.native.tsx.
 * This file exists to satisfy Expo Router's requirement for platform-specific files.
 */
export { AppLottie } from "./AppLottie.native";
