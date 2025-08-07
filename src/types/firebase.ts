import { DocumentReference, DocumentSnapshot } from 'firebase-admin/firestore';

// Simple type aliases to avoid interface conflicts
export type FirebaseDocRef = DocumentReference;
export type FirebaseDocSnapshot = DocumentSnapshot;

// Helper types for Firebase data
export type FirebaseData = Record<string, unknown>;
export type FirebaseUpdateData = Record<string, unknown>;
