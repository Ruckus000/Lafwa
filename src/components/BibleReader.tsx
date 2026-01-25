import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { getChapter, toggleBookmark, isBookmarked } from '../db/queries';

type Verse = {
    id: number;
    book: string;
    chapter: number;
    verse: number;
    text: string;
    bookmarked?: boolean;
};

interface BibleReaderProps {
    book: string;
    chapter: number;
    version: 'ht' | 'fr';
}

export default function BibleReader({ book, chapter, version }: BibleReaderProps) {
    const [verses, setVerses] = useState<Verse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadContent();
    }, [book, chapter, version]);

    const loadContent = async () => {
        setLoading(true);
        try {
            const data = await getChapter(book, chapter, version);
            // Check bookmarks
            const enriched = await Promise.all((data as Verse[]).map(async (v) => {
                const bookmarked = await isBookmarked('bible', v.id);
                return { ...v, bookmarked };
            }));
            setVerses(enriched);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLongPress = async (verse: Verse) => {
        const newStatus = await toggleBookmark('bible', verse.id);
        setVerses(current =>
            current.map(v => v.id === verse.id ? { ...v, bookmarked: newStatus } : v)
        );
        // Optional: Toast or Haptic feedback here
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <FlatList
            data={verses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <TouchableOpacity
                    onLongPress={() => handleLongPress(item)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.verseText, item.bookmarked && styles.bookmarkedText]}>
                        <Text style={styles.verseNum}>{item.verse} </Text>
                        {item.text}
                    </Text>
                </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
        />
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    verseText: {
        fontSize: 18,
        lineHeight: 28,
        marginBottom: 8,
        color: '#333',
    },
    bookmarkedText: {
        backgroundColor: '#FFF8E1', // Light yellow highlight
        color: '#B8860B',
    },
    verseNum: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
        verticalAlign: 'top',
    },
});
