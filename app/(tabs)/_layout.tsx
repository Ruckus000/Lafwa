import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                tabBarActiveTintColor: isDark ? '#fff' : '#000',
                tabBarStyle: {
                    backgroundColor: isDark ? '#1c1c1e' : '#fff',
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerStyle: {
                    backgroundColor: isDark ? '#1c1c1e' : '#fff',
                    shadowOpacity: 0,
                    elevation: 0,
                },
                headerTitleStyle: {
                    fontWeight: 'bold',
                    color: isDark ? '#fff' : '#000',
                }
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    headerTitle: 'Lafwa',
                    tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="bible"
                options={{
                    title: 'Bible',
                    tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="hymns"
                options={{
                    title: 'Hymns',
                    tabBarIcon: ({ color, size }) => <Ionicons name="musical-notes" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
