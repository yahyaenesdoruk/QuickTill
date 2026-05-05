import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RecipeService } from '../../../src/services/RecipeService';
import { RecipeIngredient, RecipeStep } from '../../../src/models/Recipe';
import { Colors } from '../../../src/constants/Colors';

const CATEGORIES = ['Kahvaltı', 'Çorba', 'Ana Yemek', 'Salata', 'Tatlı', 'İçecek', 'Genel'];

export default function AddRecipeScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Genel');
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([
    { name: '', amount: '' },
  ]);
  const [steps, setSteps] = useState<RecipeStep[]>([
    { order: 1, description: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const updateIngredient = (i: number, field: keyof RecipeIngredient, value: string) => {
    setIngredients((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      return updated;
    });
  };

  const addIngredient = () =>
    setIngredients((prev) => [...prev, { name: '', amount: '' }]);

  const removeIngredient = (i: number) =>
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));

  const updateStep = (i: number, value: string) => {
    setSteps((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], description: value };
      return updated;
    });
  };

  const addStep = () =>
    setSteps((prev) => [...prev, { order: prev.length + 1, description: '' }]);

  const removeStep = (i: number) =>
    setSteps((prev) =>
      prev
        .filter((_, idx) => idx !== i)
        .map((s, idx) => ({ ...s, order: idx + 1 }))
    );

  const handleSave = async () => {
    const validIngredients = ingredients.filter((i) => i.name.trim());
    const validSteps = steps.filter((s) => s.description.trim());

    if (!title.trim()) {
      Alert.alert('Hata', 'Tarif başlığı boş olamaz');
      return;
    }
    if (validIngredients.length === 0) {
      Alert.alert('Hata', 'En az bir malzeme ekleyin');
      return;
    }
    if (validSteps.length === 0) {
      Alert.alert('Hata', 'En az bir yapılış adımı ekleyin');
      return;
    }

    setSaving(true);
    try {
      await RecipeService.createRecipe({
        title: title.trim(),
        description: description.trim(),
        category,
        ingredients: validIngredients,
        steps: validSteps,
        prep_time: prepTime ? parseInt(prepTime) : undefined,
        servings: servings ? parseInt(servings) : undefined,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yeni Tarif</Text>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Paylaş</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Label text="Tarif Adı *" />
          <TextInput
            style={styles.input}
            placeholder="örn: Ev Yapımı Pizza"
            placeholderTextColor={Colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />

          <Label text="Kısa Description" />
          <TextInput
            style={[styles.input, { height: 72 }]}
            placeholder="Tarifinizi kısaca anlatın..."
            placeholderTextColor={Colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Label text="Category" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Label text="Prep Time (dk)" />
              <TextInput
                style={styles.input}
                placeholder="30"
                placeholderTextColor={Colors.textSecondary}
                value={prepTime}
                onChangeText={setPrepTime}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Label text="Servings" />
              <TextInput
                style={styles.input}
                placeholder="4"
                placeholderTextColor={Colors.textSecondary}
                value={servings}
                onChangeText={setServings}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredients *</Text>
            <TouchableOpacity style={styles.addSectionBtn} onPress={addIngredient}>
              <Ionicons name="add" size={18} color={Colors.primary} />
              <Text style={styles.addSectionText}>Ekle</Text>
            </TouchableOpacity>
          </View>
          {ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Malzeme adı"
                placeholderTextColor={Colors.textSecondary}
                value={ing.name}
                onChangeText={(v) => updateIngredient(i, 'name', v)}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Miktar"
                placeholderTextColor={Colors.textSecondary}
                value={ing.amount}
                onChangeText={(v) => updateIngredient(i, 'amount', v)}
              />
              {ingredients.length > 1 && (
                <TouchableOpacity onPress={() => removeIngredient(i)} style={{ padding: 4 }}>
                  <Ionicons name="remove-circle-outline" size={22} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Steps */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Yapılışı *</Text>
            <TouchableOpacity style={styles.addSectionBtn} onPress={addStep}>
              <Ionicons name="add" size={18} color={Colors.primary} />
              <Text style={styles.addSectionText}>Add Step</Text>
            </TouchableOpacity>
          </View>
          {steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.order}</Text>
              </View>
              <TextInput
                style={[styles.input, { flex: 1, height: 72 }]}
                placeholder={`${step.order}. adım açıklaması...`}
                placeholderTextColor={Colors.textSecondary}
                value={step.description}
                onChangeText={(v) => updateStep(i, v)}
                multiline
              />
              {steps.length > 1 && (
                <TouchableOpacity onPress={() => removeStep(i)} style={{ padding: 4 }}>
                  <Ionicons name="remove-circle-outline" size={22} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  content: { padding: 16, gap: 4 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
    color: Colors.text,
  },
  chips: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  twoCol: { flexDirection: 'row', gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  addSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addSectionText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  ingredientRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  stepRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    flexShrink: 0,
  },
  stepNumText: { fontSize: 13, fontWeight: '700', color: Colors.white },
});
