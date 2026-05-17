import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

/**
 * Selector estilo "input" que abre un modal con la lista de opciones.
 *
 * Props:
 *  - value:       valor seleccionado (string)
 *  - onSelect:    callback(value)
 *  - options:     array de strings, ej. ['A', 'B']
 *  - placeholder: texto cuando no hay valor
 *  - icon:        nombre de MaterialCommunityIcons (opcional)
 *  - title:       título del modal (por defecto = placeholder)
 *  - style:       estilos para el wrapper (override)
 *  - hasIconSpace: si true, deja el espacio izquierdo aunque no haya icono
 */
export default function SelectInput({
  value,
  onSelect,
  options = [],
  placeholder = 'Selecciona...',
  icon,
  title,
  style,
  hasIconSpace = false
}) {

  const [open, setOpen] = useState(false);

  const paddingLeft = (icon || hasIconSpace) ? 48 : 16;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setOpen(true)}
        style={[styles.fieldWrapper, style]}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={Colors.onSurfaceVariant}
            style={styles.fieldIcon}
          />
        )}

        <Text
          numberOfLines={1}
          style={[
            styles.fieldText,
            {
              paddingLeft,
              color: value
                ? Colors.onBackground
                : Colors.onSurfaceVariant + '99'
            }
          ]}
        >
          {value || placeholder}
        </Text>

        <Ionicons
          name="chevron-down"
          size={18}
          color={Colors.onSurfaceVariant}
          style={styles.fieldChevron}
        />
      </TouchableOpacity>


      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={[styles.modalCard, { backgroundColor: Colors.surfaceContainerHigh }]}
            onPress={() => { }} // bloquea propagación
          >

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.onSurface }]}>
                {title || placeholder}
              </Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 360 }}
              showsVerticalScrollIndicator={false}
            >
              {options.map((opt) => {

                const label = typeof opt === 'string' ? opt : opt.label;
                const val = typeof opt === 'string' ? opt : opt.value;
                const selected = String(value) === String(val);

                return (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.option,
                      {
                        backgroundColor: selected
                          ? Colors.primary + '22'
                          : 'transparent'
                      }
                    ]}
                    onPress={() => {
                      onSelect(val);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? Colors.primary : Colors.onSurface,
                        fontWeight: selected ? 'bold' : '500',
                        fontSize: 15
                      }}
                    >
                      {label}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={Colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}

              {options.length === 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: Colors.onSurfaceVariant }}>
                    Sin opciones disponibles
                  </Text>
                </View>
              )}
            </ScrollView>

          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({

  fieldWrapper: {
    height: 52,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative'
  },
  fieldIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 2
  },
  fieldText: {
    flex: 1,
    paddingRight: 44,
    fontSize: 15
  },
  fieldChevron: {
    position: 'absolute',
    right: 16
  },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 2
  }
});