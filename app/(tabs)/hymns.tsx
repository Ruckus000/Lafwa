import { StyleSheet, Text, View } from 'react-native';

export default function HymnsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Chan d'Esperans</Text>
            <Text>Hymn List Component Coming Soon...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});
