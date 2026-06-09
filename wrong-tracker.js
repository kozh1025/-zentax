import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyCc2K_lRhugslJUx3tq3ziNa42Y10Smq5Y',
  authDomain:        'kozh-5f47a.firebaseapp.com',
  projectId:         'kozh-5f47a',
  storageBucket:     'kozh-5f47a.appspot.com',
  messagingSenderId: '',
  appId:             ''
};

const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db   = getFirestore(app);

let currentUid = null;
onAuthStateChanged(auth, u => { currentUid = u ? u.uid : null; });

/**
 * Call when the user answers a question incorrectly.
 *
 * @param {string} qid           - Unique question ID, e.g. "set03-q07"
 * @param {string} set           - Set name, e.g. "set03"
 * @param {string} questionText  - The question body text
 * @param {string} userAnswer    - The label the user chose, e.g. "B"
 * @param {string} correctAnswer - The correct label, e.g. "D"
 */
export async function recordWrong(qid, set, questionText, userAnswer, correctAnswer) {
  if (!currentUid) return;

  const ref = doc(db, 'wrong_answers', currentUid, 'items', qid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await updateDoc(ref, {
      wrongCount:  increment(1),
      userAnswer,
      timestamp:   serverTimestamp(),
      mastered:    false
    });
  } else {
    await setDoc(ref, {
      qid,
      set,
      question:      questionText,
      userAnswer,
      correctAnswer,
      wrongCount:    1,
      timestamp:     serverTimestamp(),
      mastered:      false,
      starred:       false,
      lastReview:    null
    });
  }
}

/**
 * Call when the user answers a question correctly (optional — marks as mastered
 * only if they've gotten it wrong before).
 *
 * @param {string} qid
 */
export async function recordCorrect(qid) {
  if (!currentUid) return;

  const ref = doc(db, 'wrong_answers', currentUid, 'items', qid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  await updateDoc(ref, {
    mastered:   true,
    lastReview: serverTimestamp()
  });
}
