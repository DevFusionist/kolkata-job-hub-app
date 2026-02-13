import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  List,
  Divider,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const isEmployer = user?.role === 'employer';

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Profile
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <MaterialCommunityIcons
                name={isEmployer ? 'briefcase' : 'account'}
                size={64}
                color="#6200ee"
              />
              <Text variant="headlineSmall" style={styles.name}>
                {user?.name}
              </Text>
              <Chip mode="outlined" style={styles.roleChip}>
                {isEmployer ? 'Employer' : 'Job Seeker'}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <List.Item
              title="Phone"
              description={`+91 ${user?.phone}`}
              left={(props) => <List.Icon {...props} icon="phone" />}
            />

            <List.Item
              title="Location"
              description={user?.location}
              left={(props) => <List.Icon {...props} icon="map-marker" />}
            />

            {isEmployer && user?.businessName && (
              <List.Item
                title="Business Name"
                description={user.businessName}
                left={(props) => <List.Icon {...props} icon="office-building" />}
              />
            )}

            {isEmployer && (
              <List.Item
                title="Free Jobs Remaining"
                description={`${user?.freeJobsRemaining || 0} posts`}
                left={(props) => <List.Icon {...props} icon="ticket" />}
              />
            )}

            <Divider style={styles.divider} />

            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Languages
              </Text>
              <View style={styles.chipContainer}>
                {user?.languages?.map((lang) => (
                  <Chip key={lang} style={styles.chip}>
                    {lang}
                  </Chip>
                ))}
              </View>
            </View>

            {!isEmployer && user?.skills && user.skills.length > 0 && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Skills
                </Text>
                <View style={styles.chipContainer}>
                  {user.skills.map((skill) => (
                    <Chip key={skill} style={styles.chip}>
                      {skill}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <List.Item
              title="Edit Profile"
              left={(props) => <List.Icon {...props} icon="pencil" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Coming Soon', 'Edit profile feature will be added soon')}
            />

            {isEmployer && (
              <List.Item
                title="Purchase Job Posts"
                description="₹50 per job post"
                left={(props) => <List.Icon {...props} icon="cart" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => router.push('/(tabs)/post-job')}
              />
            )}

            <List.Item
              title="Help & Support"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Support', 'Contact us at support@kolkatajobs.com')}
            />

            <List.Item
              title="About"
              left={(props) => <List.Icon {...props} icon="information" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() =>
                Alert.alert(
                  'About',
                  'Kolkata Job Portal - Connecting local businesses with talent\n\nVersion 1.0.0'
                )
              }
            />
          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          icon="logout"
          textColor="#d32f2f"
        >
          Logout
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  name: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  roleChip: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
  },
  logoutButton: {
    marginVertical: 16,
    borderColor: '#d32f2f',
  },
});