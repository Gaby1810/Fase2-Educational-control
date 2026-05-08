import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export default function DashboardScreen() {

  const cards = [
    {
      title: "Total clases",
      desc: "Explora tus materias y accede a todo tu contenido académico.",
      image: "https://cdn-icons-png.flaticon.com/512/3135/3135755.png",
      icon: "book-open-page-variant"
    },
    {
      title: "Total estudiantes",
      desc: "Comparte tu experiencia con tus compañeros.",
      image: "https://cdn-icons-png.flaticon.com/512/201/201818.png",
      icon: "account-group"
    },
    {
      title: "Tareas activas",
      desc: "Mantente al día con tus deberes y entregas.",
      image: "https://cdn-icons-png.flaticon.com/512/4341/4341139.png",
      icon: "clipboard-text"
    },
    {
      title: "Promedio general",
      desc: "Visualiza tu progreso académico fácilmente.",
      image: "https://cdn-icons-png.flaticon.com/512/3135/3135789.png",
      icon: "chart-bar"
    }
  ];

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>

        <TouchableOpacity style={styles.headerBtn}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity>
          <MaterialCommunityIcons
            name="bell-outline"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* BANNER */}
        <View style={styles.bannerContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f'
            }}
            style={styles.banner}
          />

          <View style={styles.overlay}>
            <Text style={styles.bannerTitle}>
              Bienvenido a Educational Control
            </Text>
          </View>
        </View>

        {/* CARDS */}
        <View style={styles.cardsContainer}>

          {cards.map((item, index) => (

            <View key={index} style={styles.card}>

              <Image
                source={{ uri: item.image }}
                style={styles.cardImage}
              />

              <View style={styles.cardContent}>

                <View style={styles.cardTitleRow}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={18}
                    color={Colors.primary}
                  />

                  <Text style={styles.cardTitle}>
                    {item.title}
                  </Text>
                </View>

                <Text style={styles.cardDesc}>
                  {item.desc}
                </Text>

              </View>

            </View>

          ))}

        </View>

      </ScrollView>

      {/* NAVBAR */}
      <View style={styles.bottomNav}>

        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons
            name="home-outline"
            size={24}
            color={Colors.primary}
          />
          <Text style={styles.navTextActive}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons
            name="book-outline"
            size={24}
            color="#777"
          />
          <Text style={styles.navText}>Clases</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons
            name="clipboard-account-outline"
            size={24}
            color="#777"
          />
          <Text style={styles.navText}>Estudiantes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons
            name="account-outline"
            size={24}
            color="#777"
          />
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },

  header: {
    height: 70,
    backgroundColor: '#0B2C74',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bannerContainer: {
    position: 'relative',
  },

  banner: {
    width: '100%',
    height: 170,
  },

  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  bannerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  cardsContainer: {
    padding: 15,
    gap: 15,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 12,
    elevation: 3,
    alignItems: 'center',
  },

  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },

  cardContent: {
    flex: 1,
    marginLeft: 15,
  },

  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },

  cardDesc: {
    color: '#666',
    lineHeight: 20,
  },

  bottomNav: {
    height: 75,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#eee',
  },

  navItem: {
    alignItems: 'center',
  },

  navText: {
    fontSize: 12,
    color: '#777',
    marginTop: 3,
  },

  navTextActive: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 3,
  },

});