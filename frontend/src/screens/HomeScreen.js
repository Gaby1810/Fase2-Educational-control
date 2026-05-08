import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Background Decorative Elements */}
      <View style={styles.decorativeContainer} pointerEvents="none">
        <View style={[styles.decorCircle, styles.decorTop]} />
        <View style={[styles.decorCircle, styles.decorBottom]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoText}>EDUCATIONAL CONTROL</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>
              Control Académico en un Solo Lugar
            </Text>
          </View>

          <View style={styles.illustrationContainer}>
            <View style={styles.imageWrapper}>
              <Image
                source={require('../../assets/background-home.png')}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.primaryButtonText}>Crear cuenta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.secondaryButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  decorativeContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  decorCircle: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    opacity: 0.25,
  },
  decorTop: {
    top: -height * 0.15,
    right: -width * 0.3,
    backgroundColor: Colors.surfaceVariant,
  },
  decorBottom: {
    bottom: -height * 0.15,
    left: -width * 0.3,
    backgroundColor: Colors.surfaceBright,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 32,
  },
  logoText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 22,
    letterSpacing: 4,
    color: Colors.onSurface,
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heroTextContainer: {
    marginBottom: 48,
    maxWidth: 300,
  },
  heroTitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 20,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 28,
  },
  illustrationContainer: {
    width: width * 0.8,
    aspectRatio: 1,
    maxWidth: 320,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 32,
  },
  buttonContainer: {
    maxWidth: 340,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: Colors.inverseSurface,
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: Colors.surface,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  secondaryButtonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: Colors.onSurface,
  },
});
