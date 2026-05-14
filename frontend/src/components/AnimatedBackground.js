import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

const { width, height } = Dimensions.get('window');

/**
 * Fondo profesional con 3 orbes de luz que se desplazan
 * lentamente y respiran (efecto "aurora"). 100% transform-based,
 * compatible con Fabric/new architecture.
 *
 * Props:
 *  - intensity: 'soft' | 'normal' | 'vivid'  (default: 'normal')
 */
export default function AnimatedBackground({ intensity = 'normal' }) {

  // 3 valores animados independientes
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;

  // Shimmer diagonal lento (efecto "premium")
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopVal = (val, duration) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          }),
          Animated.timing(val, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          })
        ])
      );

    const loopShimmer = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );

    const anims = [
      loopVal(a1, 11000),
      loopVal(a2, 15000),
      loopVal(a3, 19000),
      loopShimmer
    ];

    anims.forEach((a) => a.start());

    return () => anims.forEach((a) => a.stop && a.stop());
  }, []);

  // Intensidad
  const opacities = {
    soft:   { o1: 0.18, o2: 0.14, o3: 0.12, sh: 0.04 },
    normal: { o1: 0.28, o2: 0.22, o3: 0.20, sh: 0.06 },
    vivid:  { o1: 0.40, o2: 0.32, o3: 0.28, sh: 0.10 }
  }[intensity] || { o1: 0.28, o2: 0.22, o3: 0.20, sh: 0.06 };

  // Orbe 1 — esquina superior izquierda, color primario
  const orb1Style = {
    opacity: opacities.o1,
    transform: [
      { translateX: a1.interpolate({ inputRange: [0, 1], outputRange: [-60, 70] }) },
      { translateY: a1.interpolate({ inputRange: [0, 1], outputRange: [-40, 80] }) },
      { scale: a1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }
    ]
  };

  // Orbe 2 — esquina inferior derecha, color secundario
  const orb2Style = {
    opacity: opacities.o2,
    transform: [
      { translateX: a2.interpolate({ inputRange: [0, 1], outputRange: [40, -80] }) },
      { translateY: a2.interpolate({ inputRange: [0, 1], outputRange: [-30, 50] }) },
      { scale: a2.interpolate({ inputRange: [0, 1], outputRange: [1.1, 0.95] }) }
    ]
  };

  // Orbe 3 — flotando en el medio, color surfaceBright
  const orb3Style = {
    opacity: opacities.o3,
    transform: [
      { translateX: a3.interpolate({ inputRange: [0, 1], outputRange: [-40, 60] }) },
      { translateY: a3.interpolate({ inputRange: [0, 1], outputRange: [60, -60] }) },
      { scale: a3.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }) }
    ]
  };

  // Shimmer diagonal que cruza la pantalla
  const shimmerStyle = {
    opacity: opacities.sh,
    transform: [
      { translateX: shimmer.interpolate({ inputRange: [0, 1], outputRange: [-width, width] }) },
      { rotate: '20deg' }
    ]
  };

  return (
    <View
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      {/* Base oscura */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.background }]} />

      {/* Orbe 1 */}
      <Animated.View style={[styles.orbWrap, styles.orb1Pos, orb1Style]}>
        <LinearGradient
          colors={[Colors.primary, Colors.primary + '00']}
          style={styles.orbGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Orbe 2 */}
      <Animated.View style={[styles.orbWrap, styles.orb2Pos, orb2Style]}>
        <LinearGradient
          colors={[Colors.secondary, Colors.secondary + '00']}
          style={styles.orbGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0, y: 0 }}
        />
      </Animated.View>

      {/* Orbe 3 */}
      <Animated.View style={[styles.orbWrap, styles.orb3Pos, orb3Style]}>
        <LinearGradient
          colors={[Colors.surfaceBright, Colors.surfaceBright + '00']}
          style={styles.orbGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>

      {/* Shimmer diagonal */}
      <Animated.View style={[styles.shimmer, shimmerStyle]}>
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(203,214,255,0.35)',
            'rgba(255,255,255,0)'
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Vignette suave abajo para que el contenido del form contraste */}
      <LinearGradient
        colors={['transparent', 'rgba(0,12,45,0.55)']}
        style={styles.vignette}
        pointerEvents="none"
      />
    </View>
  );
}

const ORB_SIZE = Math.max(width, height) * 0.9;

const styles = StyleSheet.create({
  orbWrap: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    overflow: 'hidden'
  },
  orbGradient: {
    flex: 1,
    borderRadius: ORB_SIZE / 2
  },
  orb1Pos: {
    top: -ORB_SIZE * 0.4,
    left: -ORB_SIZE * 0.3
  },
  orb2Pos: {
    bottom: -ORB_SIZE * 0.35,
    right: -ORB_SIZE * 0.3
  },
  orb3Pos: {
    top: height * 0.25,
    left: -ORB_SIZE * 0.2
  },
  shimmer: {
    position: 'absolute',
    width: width * 2,
    height: 240,
    top: height * 0.35
  },
  vignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: height * 0.4
  }
});
