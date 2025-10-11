import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteAccount } from '../lib/auth';

export default function AccountDeletionScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleDeleteAccount = async () => {
    Alert.alert(
      'מחיקת חשבון',
      'האם אתה בטוח שברצונך למחוק את החשבון שלך? פעולה זו אינה הפיכה ותמחק את כל הנתונים שלך לצמיתות.',
      [
        {
          text: 'ביטול',
          style: 'cancel',
        },
        {
          text: 'מחק חשבון',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await deleteAccount();

              if (result.success) {
                Alert.alert(
                  'החשבון נמחק',
                  'החשבון שלך נמחק בהצלחה',
                  [{ text: 'OK' }]
                );
                // Navigation will be handled by AuthContext
              } else {
                Alert.alert(
                  'שגיאה',
                  result.error?.message || 'שגיאה במחיקת החשבון'
                );
              }
            } catch (error) {
              Alert.alert('שגיאה', error.message || 'שגיאה במחיקת החשבון');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>מחיקת חשבון</Text>
          <Text style={styles.subtitle}>
            מחיקת החשבון תסיר לצמיתות את כל הנתונים שלך
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningTitle}>אזהרה - פעולה בלתי הפיכה</Text>
            <Text style={styles.warningText}>
              מחיקת החשבון תמחק באופן קבוע:
            </Text>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>את כל הצעות המחיר שלך</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>את כל הלקוחות שלך</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>את כל המוצרים שלך</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>את פרטי החשבון שלך</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>את היסטוריית המנויים שלך</Text>
            </View>
          </View>

          <View style={styles.confirmationBox}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                confirmed && styles.checkboxChecked,
              ]}
              onPress={() => setConfirmed(!confirmed)}
            >
              {confirmed && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.confirmationText}>
              אני מבין שפעולה זו תמחק את כל הנתונים שלי לצמיתות ואינה הפיכה
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              (!confirmed || loading) && styles.deleteButtonDisabled,
            ]}
            onPress={handleDeleteAccount}
            disabled={!confirmed || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.deleteButtonText}>מחק את החשבון שלי</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>ביטול</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  warningBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  warningIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 12,
    textAlign: 'right',
  },
  warningText: {
    fontSize: 14,
    color: '#7f1d1d',
    marginBottom: 12,
    textAlign: 'right',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 12,
  },
  bullet: {
    fontSize: 16,
    color: '#991b1b',
    marginLeft: 8,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#7f1d1d',
    textAlign: 'right',
  },
  confirmationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmationText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    textAlign: 'right',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
});
