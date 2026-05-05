import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RecipeService } from '../../../src/services/RecipeService';
import { Recipe } from '../../../src/models/Recipe';
import { useAuth } from '../../../src/context/AuthContext';
import { Colors } from '../../../src/constants/Colors';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const load = async () => {
    try {
      const data = await RecipeService.getRecipe(recipeId);
      setRecipe(data);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [recipeId]);

  const handleDelete = () => {
    Alert.alert('Tarifi Delete', 'Bu tarifi silmek istediğine emin misin?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await RecipeService.deleteRecipe(recipeId);
            router.back();
          } catch (e: any) {
            Alert.alert('Hata', e.message);
          }
        },
      },
    ]);
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setSendingComment(true);
    try {
      await RecipeService.addComment(recipeId, comment.trim());
      setComment('');
      load();
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('Yorumu Delete', 'Bu yorumu silmek istediğine emin misin?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await RecipeService.deleteComment(recipeId, commentId);
            load();
          } catch (e: any) {
            Alert.alert('Hata', e.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!recipe) return null;

  const canDelete =
    user?.id === recipe.author_id || user?.role === 'admin';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {recipe.title}
          </Text>
          {canDelete && (
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Title & Meta */}
          <View style={styles.titleSection}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{recipe.category}</Text>
            </View>
            <Text style={styles.title}>{recipe.title}</Text>
            {recipe.description ? (
              <Text style={styles.description}>{recipe.description}</Text>
            ) : null}
            <View style={styles.metaRow}>
              <MetaChip icon="person-outline" text={recipe.author_name} />
              {recipe.prep_time ? (
                <MetaChip icon="time-outline" text={`${recipe.prep_time} dk`} />
              ) : null}
              {recipe.servings ? (
                <MetaChip icon="people-outline" text={`${recipe.servings} kişi`} />
              ) : null}
            </View>
          </View>

          {/* Ingredients */}
          <Section title="Malzemeler">
            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <View style={styles.bullet} />
                <Text style={styles.ingredientName}>{ing.name}</Text>
                <Text style={styles.ingredientAmount}>{ing.amount}</Text>
              </View>
            ))}
          </Section>

          {/* Steps */}
          <Section title="Yapılışı">
            {recipe.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{step.order}</Text>
                </View>
                <Text style={styles.stepText}>{step.description}</Text>
              </View>
            ))}
          </Section>

          {/* Comments */}
          <Section title={`Comments (${recipe.comments.length})`}>
            {recipe.comments.length === 0 ? (
              <Text style={styles.noComments}>
                Henüz yorum yok. İlk yorumu siz yapın!
              </Text>
            ) : (
              recipe.comments.map((c) => {
                const canDeleteComment =
                  user?.id === c.author_id || user?.role === 'admin';
                return (
                  <View key={c.id} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentAuthor}>{c.author_name}</Text>
                      <Text style={styles.commentUsername}>@{c.author_username}</Text>
                      {canDeleteComment && (
                        <TouchableOpacity
                          style={{ marginLeft: 'auto' }}
                          onPress={() => handleDeleteComment(c.id)}
                        >
                          <Ionicons name="trash-outline" size={16} color={Colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.commentText}>{c.text}</Text>
                  </View>
                );
              })
            )}
          </Section>
        </ScrollView>

        {/* Comment input */}
        <View style={styles.commentInput}>
          <TextInput
            style={styles.commentField}
            placeholder="Yorum yaz..."
            placeholderTextColor={Colors.textSecondary}
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!comment.trim() || sendingComment) && styles.sendBtnDisabled]}
            onPress={handleAddComment}
            disabled={!comment.trim() || sendingComment}
          >
            {sendingComment ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="send" size={18} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MetaChip({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon as any} size={14} color={Colors.primary} />
      <Text style={styles.metaChipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text },
  content: { padding: 16, gap: 0 },
  titleSection: { marginBottom: 20 },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${Colors.primary}18`,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaChipText: { fontSize: 12, color: Colors.text },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  ingredientName: { flex: 1, fontSize: 14, color: Colors.text },
  ingredientAmount: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  stepText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 22, paddingTop: 4 },
  noComments: { fontSize: 14, color: Colors.textSecondary, fontStyle: 'italic' },
  commentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: Colors.text },
  commentUsername: { fontSize: 12, color: Colors.textSecondary },
  commentText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  commentField: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
