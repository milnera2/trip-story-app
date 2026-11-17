import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { characterImage } from '../characterImage';
import { CHARACTERS, CHARACTER_COLORS, characterAvatar, parseAvatar, type CharacterId } from '../characters';
import { fonts, useColors } from '../theme';
import { ActionButton, Body } from './ui';

function Figure({ id, color, size }: { id: CharacterId; color: string; size: number }) {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    setUri(null);
    characterImage(id, color).then((u) => current && setUri(u));
    return () => {
      current = false;
    };
  }, [id, color]);
  return uri ? <Image source={{ uri }} accessibilityIgnoresInvertColors style={{ width: size, height: size }} /> : <View style={{ width: size, height: size }} />;
}

// Pick one of the 3D characters and its colour. `current` is the stored avatar value.
export function CharacterPicker({ current, busy, onSave, onCancel }: { current: string | null; busy: boolean; onSave: (avatar: string) => void; onCancel: () => void }) {
  const c = useColors();
  const start = parseAvatar(current);
  const [id, setId] = useState<CharacterId>(start.kind === 'character' ? start.id : 'fox');
  const [color, setColor] = useState<string>(start.kind === 'character' ? start.color.toUpperCase() : CHARACTER_COLORS[0].hex);
  return (
    <View style={{ gap: 14 }}>
      <View style={{ alignItems: 'center', paddingVertical: 8, borderRadius: 20, backgroundColor: `${color}30` }}>
        <Figure id={id} color={color} size={150} />
      </View>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CHARACTERS.map((item) => {
          const on = item.id === id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="radio"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: on }}
              onPress={() => setId(item.id)}
              style={{ width: 76, alignItems: 'center', paddingVertical: 4, borderRadius: 16, borderWidth: 2, borderColor: on ? c.link : 'transparent', backgroundColor: on ? c.chipOn : c.chip }}
            >
              <Figure id={item.id} color={color} size={56} />
              <Text style={{ color: on ? c.link : c.onSheetVariant, fontFamily: fonts.label, fontSize: 12 }}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Body dim>Color</Body>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {CHARACTER_COLORS.map((swatch) => {
          const on = swatch.hex === color;
          return (
            <Pressable
              key={swatch.hex}
              accessibilityRole="radio"
              accessibilityLabel={swatch.label}
              accessibilityState={{ selected: on }}
              onPress={() => setColor(swatch.hex)}
              hitSlop={4}
              style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: swatch.hex, borderWidth: 3, borderColor: on ? c.ink : 'transparent' }}
            >
              {on ? <MaterialIcons name="check" size={22} color="#1B2A33" /> : null}
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <ActionButton label="Use this character" icon="check" busy={busy} disabled={busy} onPress={() => onSave(characterAvatar(id, color))} />
        <ActionButton label="Cancel" variant="glass" disabled={busy} onPress={onCancel} />
      </View>
    </View>
  );
}
