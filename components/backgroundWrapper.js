import React from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  SafeAreaView,
} from "react-native";

export default function BackgroundWrapper({
  children,
  overlayOpacity = 0.05, // allow customization
  padding = true, // allow turning padding on/off
  fullScreen = false,
}) {
  return (
    <ImageBackground
      source={require("../assets/background1.png")}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Overlay */}
      <View
        style={[
          styles.overlay,
          { backgroundColor: `rgba(0,0,0,${overlayOpacity})` },
        ]}
      />

      {/* Content */}
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.content, padding && styles.padding]}>
          {children}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  padding: {
    paddingTop: 15,
    paddingHorizontal: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});