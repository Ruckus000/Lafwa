import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BibleReader from '../../src/components/BibleReader';
import { getBookList } from '../../src/db/queries';

export default function BibleScreen() {
    const [book, setBook] = useState('Jenèz');
    const [chapter, setChapter] = useState(1);
    const [version, setVersion] = useState<'ht' | 'fr'>('ht');
    const [books, setBooks] = useState<{ book: string }[]>([]);
    const [showBookModal, setShowBookModal] = useState(false);

    useEffect(() => {
        loadBooks();
    }, []);

    const loadBooks = async () => {
        const list = await getBookList();
        setBooks(list as { book: string }[]);
    };

    const changeChapter = (delta: number) => {
        const newChapter = chapter + delta;
        if (newChapter >= 1) {
            setChapter(newChapter);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setShowBookModal(true)} style={styles.bookSelector}>
                    <Text style={styles.bookTitle}>{book} {chapter}</Text>
                    <Ionicons name="caret-down" size={16} color="#000" />
                </TouchableOpacity>

                <View style={styles.controls}>
                    <TouchableOpacity onPress={() => setVersion(v => v === 'ht' ? 'fr' : 'ht')} style={styles.versionBadge}>
                        <Text style={styles.versionText}>{version.toUpperCase()}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <BibleReader book={book} chapter={chapter} version={version} />

            <View style={styles.footer}>
                <TouchableOpacity onPress={() => changeChapter(-1)} style={styles.navData}>
                    <Ionicons name="chevron-back" size={24} color="#007AFF" />
                    <Text style={styles.navText}>Prev</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => changeChapter(1)} style={styles.navData}>
                    <Text style={styles.navText}>Next</Text>
                    <Ionicons name="chevron-forward" size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>

            <Modal visible={showBookModal} animationType="slide">
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Book</Text>
                        <TouchableOpacity onPress={() => setShowBookModal(false)}>
                            <Ionicons name="close" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={books}
                        keyExtractor={item => item.book}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.bookItem} onPress={() => {
                                setBook(item.book);
                                setChapter(1);
                                setShowBookModal(false);
                            }}>
                                <Text style={styles.bookItemText}>{item.book}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </SafeAreaView>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    bookSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    bookTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    controls: {
        flexDirection: 'row',
        gap: 16,
    },
    versionBadge: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    versionText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    navData: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    navText: {
        fontSize: 16,
        color: '#007AFF',
        marginHorizontal: 4,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    bookItem: {
        padding: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
    },
    bookItemText: {
        fontSize: 18,
    },
});
