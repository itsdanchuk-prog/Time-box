import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, SafeAreaView, Platform, StatusBar, Button, Alert, Modal, ScrollView, I18nManager, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import useStore from './src/store/useStore';

// --- EDITORIAL DROP CAP COMPONENT ---
const DropCapText = ({ text, style, size = 16, color = '#2C2B29', boldFirst = true }: { text: string; style?: any; size?: number, color?: string, boldFirst?: boolean }) => {
  if (!text) return null;
  const firstLetter = text.charAt(0);
  const rest = text.slice(1);

  return (
    <Text style={[style, { fontFamily: 'Georgia' }]}>
      <Text style={{
        fontFamily: 'Georgia',
        fontSize: size * (boldFirst ? 2.0 : 1),
        fontWeight: 'bold',
        color: '#4A6741',
      }}>
        {firstLetter}
      </Text>
      <Text style={{ fontFamily: 'Georgia', fontSize: size }}>
        {rest}
      </Text>
    </Text>
  );
};

// --- TRANSLATIONS ---
const translations = {
  en: {
    toggleLabel: 'עברית',
    headline: "Own Your Day.\nOne Box at a Time.",
    philosophy: "Timeboxing is the productivity secret of the world's most successful people. Instead of a never-ending 'To-Do List' that creates anxiety, Timeboxing asks you to allocate a fixed 'box' of time for every task.",
    philosophy2: "By deciding when and where you will do something, you remove the decision fatigue that leads to procrastination.",
    benefits: ["• Deep Focus", "• Realistic Planning", "• Mental Clarity"],
    step1Title: "Collect",
    step1Desc: "Capture your tasks with intention.",
    step2Title: "Select",
    step2Desc: "Curate your absolute Top 3 priorities.",
    step3Title: "Box",
    step3Desc: "Commit them to the grid.",
    startBtn: "Start Planning"
  },
  he: {
    toggleLabel: 'English',
    headline: "נצח את היום שלך,\nתיבה אחת בכל פעם.",
    philosophy: "שיטת התיבות (Timeboxing) היא סוד הפרודוקטיביות של האנשים המצליחים ביותר בעולם. במקום רשימת מטלות שלא נגמרת ויוצרת חרדה, השיטה מבקשת ממך להקצות 'תיבה' קבועה של זמן לכל משימה.",
    philosophy2: "על ידי החלטה מתי ואיפה תבצע כל דבר, אתה מסיר את 'עייפות ההחלטה' שמובילה לדחיינות.",
    benefits: ["• מיקוד עמוק", "• תכנון ריאלי", "• בהירות מחשבתית"],
    step1Title: "איסוף",
    step1Desc: "רשום את המשימות שלך מתוך כוונה.",
    step2Title: "בחירה",
    step2Desc: "בחר את 3 סדרי העדיפויות המובילים שלך.",
    step3Title: "שיבוץ",
    step3Desc: "שבץ אותן בלוח הזמנים והתחייב אליהן.",
    startBtn: "התחל לתכנן"
  }
};

export default function App() {
  // --- STATE (ALL HOOKS AT TOP) ---
  const [inputText, setInputText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stage 0: Modal Form
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(30);
  const [newTaskLocation, setNewTaskLocation] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');

  // Stage 2: Interaction
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Store Hooks (UNCONDITIONAL)
  const tasks = useStore((state) => state.tasks);
  const addTask = useStore((state) => state.addTask);
  const removeTask = useStore((state) => state.removeTask);
  const updateTask = useStore((state) => state.updateTask);
  const toggleTask = useStore((state) => state.toggleTask);
  const stage = useStore((state) => state.stage);
  const setStage = useStore((state) => state.setStage);
  const grid = useStore((state) => state.grid);
  const assignTaskToGrid = useStore((state) => state.assignTaskToGrid);
  const removeTaskFromGrid = useStore((state) => state.removeTaskFromGrid);
  const removeTaskInstance = useStore((state) => state.removeTaskInstance);
  const completedSlots = useStore((state) => state.completedSlots);
  const toggleSlotCompletion = useStore((state) => state.toggleSlotCompletion);
  const resetGrid = useStore((state) => state.resetGrid);
  const saveSession = useStore((state) => state.saveSession);
  const history = useStore(state => state.history) || [];

  // Language
  const language = useStore((state) => state.language);
  const setLanguage = useStore((state) => state.setLanguage);

  // Finalized Timebox
  const finalizedTimebox = useStore((state) => state.finalizedTimebox);
  const finalizeTimebox = useStore((state) => state.finalizeTimebox);

  const text = translations[language];
  const isRTL = language === 'he';
  const textAlign = isRTL ? 'right' : 'left';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  // --- TIME & STATS LOGIC (HOISTED) ---
  const now = new Date();
  const currentH = now.getHours();
  const currentM = now.getMinutes();
  const roundedM = Math.floor(currentM / 15) * 15;
  const currentSlot = `${currentH.toString().padStart(2, '0')}:${roundedM.toString().padStart(2, '0')}`;

  const nextJumpM = roundedM + 15;
  const nextJumpH = nextJumpM === 60 ? currentH + 1 : currentH;
  const nextJumpMStr = (nextJumpM === 60 ? 0 : nextJumpM).toString().padStart(2, '0');
  const jumpTimeStr = `${nextJumpH.toString().padStart(2, '0')}:${nextJumpMStr}`;

  // Stats Logic for Home
  const lastSession = history[0];
  const deepRatio = lastSession ? `${Math.round((lastSession.deepBlocks / (lastSession.deepBlocks + lastSession.shallowBlocks || 1)) * 100)}/${Math.round((lastSession.shallowBlocks / (lastSession.deepBlocks + lastSession.shallowBlocks || 1)) * 100)}` : "75/25";
  const recentHistory = history.slice(0, 7);
  const avgFocus = recentHistory.length > 0
    ? Math.round(recentHistory.reduce((acc, curr) => acc + curr.focusScore, 0) / recentHistory.length)
    : 82;

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // --- GEN 15-MIN GRID ---
  const timeSlots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      timeSlots.push(timeString);
    }
  }

  // --- HANDLERS ---
  const openNewTaskModal = () => {
    setEditingTaskId(null);
    setNewTaskTitle('');
    setNewTaskDuration(30);
    setNewTaskLocation('');
    setNewTaskDescription('');
    setModalVisible(true);
  };

  const openEditTaskModal = (task: any) => {
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskDuration(task.duration);
    setNewTaskLocation(task.location || '');
    setNewTaskDescription(task.description || '');
    setModalVisible(true);
  };

  const handleSaveTask = () => {
    if (newTaskTitle.length >= 3 && newTaskTitle.length <= 40) {
      if (editingTaskId) {
        updateTask(editingTaskId, newTaskTitle, newTaskDuration, newTaskDescription, newTaskLocation);
      } else {
        addTask(newTaskTitle, newTaskDuration, newTaskDescription, newTaskLocation);
      }
      setModalVisible(false);
    } else {
      Alert.alert('Details Needed', 'Task title must be 3-40 characters.');
    }
  };

  const getSlotsForTask = (startTime: string, durationMinutes: number): string[] => {
    const startIndex = timeSlots.indexOf(startTime);
    if (startIndex === -1) return [];
    const slotsNeeded = Math.ceil(durationMinutes / 15);
    return timeSlots.slice(startIndex, startIndex + slotsNeeded);
  };

  const handleSlotPress = (time: string) => {
    const existingTaskId = grid[time];

    // REMOVE MODE - Task already exists at this slot
    if (existingTaskId) {
      const task = tasks.find(t => t.id === existingTaskId);
      if (!task) return;

      // Find all slots for this task
      const taskSlots = Object.entries(grid)
        .filter(([_, id]) => id === existingTaskId)
        .map(([slot]) => slot);

      // Confirmation for long tasks (> 60 minutes)
      if (task.duration > 60) {
        Alert.alert(
          'Remove Task?',
          `Remove "${task.title}" from the grid?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: () => {
                taskSlots.forEach(slot => removeTaskFromGrid(slot));
                setSelectedSlot(null);
              }
            }
          ]
        );
      } else {
        // Quick remove for short tasks
        taskSlots.forEach(slot => removeTaskFromGrid(slot));
        setSelectedSlot(null);
      }
      return;
    }

    // ASSIGN MODE
    setSelectedSlot(null);
    if (!activeTaskId) {
      Alert.alert('Select a Task', 'Tap a task from your dock first.');
      return;
    }

    // STRICT: Check duplicate
    if (Object.values(grid).includes(activeTaskId)) {
      Alert.alert('Already Scheduled', 'This task is already on your grid.');
      setActiveTaskId(null);
      return;
    }

    // MULTI-SLOT LOGIC
    const task = tasks.find(t => t.id === activeTaskId);
    if (!task) return;

    const slotsToFill = getSlotsForTask(time, task.duration);
    if (slotsToFill.length < (task.duration / 15)) {
      Alert.alert('Insufficient Time', 'Not enough space left in the day.');
      return;
    }
    const collision = slotsToFill.some(slot => grid[slot]);
    if (collision) {
      Alert.alert('Overlap', 'Another task is in the way.');
      return;
    }

    slotsToFill.forEach(slot => assignTaskToGrid(slot, activeTaskId));
    setActiveTaskId(null);
  };

  // --- SUB-COMPONENTS ---
  const Atmosphere = () => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={{ flex: 1, backgroundColor: '#FFFBF5' }} />
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 300,
        backgroundColor: '#F2F7F2',
        opacity: 0.6
      }} />
      <View style={{
        position: 'absolute',
        top: '30%',
        right: -50,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(74, 103, 65, 0.08)',
        transform: [{ scale: 1.5 }]
      }} />
    </View>
  );

  const renderEditButton = (task: any) => (
    <TouchableOpacity
      style={styles.editButton}
      onPress={() => openEditTaskModal(task)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.editButtonText}>✎</Text>
    </TouchableOpacity>
  );

  const HomeButton = () => (
    <TouchableOpacity
      style={{
        position: 'absolute',
        top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
        left: isRTL ? undefined : 20,
        right: isRTL ? 20 : undefined,
        zIndex: 100,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 20,
        padding: 8
      }}
      onPress={() => {
        if (stage === 2) {
          Alert.alert("Exit to Home?", "Your current grid progress will not be saved.", [
            { text: "Cancel", style: "cancel" },
            { text: "Exit", style: "destructive", onPress: () => setStage(-2) }
          ]);
        } else {
          setStage(-2);
        }
      }}
    >
      <Ionicons name="home-outline" size={24} color="#4A6741" />
    </TouchableOpacity>
  );

  const ResetGridButton = () => {
    if (stage !== 2) return null;

    return (
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
          left: isRTL ? 70 : undefined,
          right: isRTL ? undefined : 70,
          zIndex: 100,
          backgroundColor: 'rgba(255,255,255,0.8)',
          borderRadius: 20,
          padding: 8
        }}
        onPress={() => {
          Alert.alert(
            "Reset Grid?",
            "This will clear all tasks from the grid. Tasks will remain in your selection.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Reset",
                style: "destructive",
                onPress: () => {
                  resetGrid();
                  setActiveTaskId(null);
                  setSelectedSlot(null);
                }
              }
            ]
          );
        }}
      >
        <Ionicons name="refresh-outline" size={24} color="#4A6741" />
      </TouchableOpacity>
    );
  };

  const HelpButton = () => {
    let targetStage = 0;
    if (stage === 0) targetStage = 10;
    else if (stage === 10) targetStage = 0; // Toggle back
    if (stage === 1) targetStage = 11;
    else if (stage === 11) targetStage = 1; // Toggle back
    if (stage === 2) targetStage = 12;
    else if (stage === 12) targetStage = 2; // Toggle back

    if ((stage < 0 || stage > 2) && stage !== 10 && stage !== 11 && stage !== 12) return null; // Show on 0, 1, 2, 10, 11, 12

    return (
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
          right: isRTL ? undefined : 25,
          left: isRTL ? 25 : undefined,
          zIndex: 100,
          backgroundColor: 'rgba(255,255,255,0.8)',
          borderRadius: 20,
          padding: 8
        }}
        onPress={() => setStage(targetStage)}
      >
        <Ionicons name="help-circle-outline" size={24} color="#4A6741" />
      </TouchableOpacity>
    );
  };

  const BackButton = ({ targetStage }: { targetStage: number }) => (
    <TouchableOpacity
      style={{
        position: 'absolute',
        top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
        left: isRTL ? undefined : 25,
        right: isRTL ? 25 : undefined,
        zIndex: 100,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 20,
        padding: 8
      }}
      onPress={() => setStage(targetStage)}
    >
      <Ionicons name="arrow-back" size={24} color="#4A6741" />
    </TouchableOpacity>
  );

  const ProgressBar = ({ currentStage }: { currentStage: number }) => {
    const steps = ["Collection", "Selection", "Grid"];
    const blueColor = '#005BBB'; // User's preferred Blue
    const screenWidth = Dimensions.get('window').width;
    const paddingHorizontal = 20;
    // Calculate widths
    // We want 3 segments to span the width.
    // They overlap by `arrowDepth`.
    // Let's make them equal visual width.
    // Visual Width = (TotalWidth) / 3.
    // Segment Width (SVG) = Visual Width + ArrowDepth.

    const arrowDepth = 15;
    const height = 36;
    const radius = 18; // Pill radius

    const totalAvailableWidth = screenWidth - (paddingHorizontal * 2);
    const stepVisualWidth = totalAvailableWidth / 3;
    const stepSvgWidth = stepVisualWidth + arrowDepth;

    // Correction: The last segment doesn't have an arrow sticking out, but it has the rounded end.
    // The "Visual Width" logic is:
    // Seg 1: Rounded Left ... Arrow Tip (Tip is Extra) -> Width = Visual + Tip
    // Seg 2: Cutout (eats Tip space) ... Arrow Tip (Tip is Extra) -> Width = Visual + Tip. (Starts at -Tip).
    // Seg 3: Cutout (eats Tip space) ... Rounded Right. -> Width = Visual. (Starts at -Tip).

    // Simpler: Just make them all `stepSvgWidth`. Masking/Clipping handles the rest.

    return (
      <View style={{
        flexDirection: 'row',
        height: height,
        width: '100%',
        paddingHorizontal: paddingHorizontal,
        marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 30 : 70, // Moved up to close gap with Icons (at 50)
        marginBottom: 20,
        zIndex: 50,
      }}>
        {steps.map((label, index) => {
          const isActive = index === currentStage;
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;

          // Colors
          const fillColor = isActive ? '#4A6741' : 'transparent'; // App Green for Active as requested in recent prompt
          const strokeColor = '#4A6741'; // App Green stroke
          const strokeWidth = isActive ? 0 : 1;
          const textColor = isActive ? '#FFF' : '#4A6741';

          // Path Generation
          let d = "";
          const w = stepVisualWidth; // The body width
          const ad = arrowDepth;
          const h = height;
          const r = radius;

          // Coordinate logic:
          // We are drawing inside a box of width probably `stepVisualWidth + arrowDepth`.
          // But to make them "Continuous", we just set fixed width and manage d path.

          // Let's assume each View is `stepVisualWidth` wide.
          // IsFirst: 
          //   Owns [0...w].
          //   Draws: Rounded Left, Lines... Arrow Tip goes to `w + ad`.
          //   View style zIndex must be high to show tip? 
          //   Actually, standard flow: Previous on TOP? or Next on TOP?
          //   If Next has Cutout, it should be on TOP of Previous Tip.
          //   So Index 0 (First) z=3. Index 1 z=2. Index 2 z=1? 
          //   No. If Next is on TOP (z=2), then Next's Cutout (Transparent) reveals Prev's Tip (Solid).
          //   Yes. Next must be on TOP of Prev.
          //   Index 0: z=1. Index 1: z=2. Index 2: z=3.

          // Width of SVG:
          // We need enough space to draw the Tip if we are First/Middle.
          // We need enough space to start at -ad if we are Middle/Last (to account for cutout).

          // Let's use `stepVisualWidth + arrowDepth` as the basis for drawing.

          if (isFirst) {
            // M r,0 L w,0 L w+ad,h/2 L w,h L r,h Q 0,h 0,h-r L 0,r Q 0,0 r,0 Z
            d = `M ${r},0 L ${w},0 L ${w + ad},${h / 2} L ${w},${h} L ${r},${h} Q 0,${h} 0,${h - r} L 0,${r} Q 0,0 ${r},0 Z`;
          } else if (isLast) {
            // M 0,0 L w-r,0 Q w,0 w,r L w,h-r Q w,h w-r,h L 0,h L ad,h/2 L 0,0 Z
            // Note: Starts at 0,0 (which connects to prev tip). But `w` here is the visual width.
            d = `M 0,0 L ${w - r},0 Q ${w},0 ${w},${r} L ${w},${h - r} Q ${w},${h} ${w - r},${h} L 0,${h} L ${ad},${h / 2} L 0,0 Z`;
          } else {
            // Middle
            // M 0,0 L w,0 L w+ad,h/2 L w,h L 0,h L ad,h/2 L 0,0 Z
            d = `M 0,0 L ${w},0 L ${w + ad},${h / 2} L ${w},${h} L 0,${h} L ${ad},${h / 2} L 0,0 Z`;
          }

          return (
            <View key={index} style={{
              width: stepVisualWidth,
              height: height,
              // Overlap logic:
              // Segment N+1 starts `arrowDepth` to the Left? 
              // No, we designed the paths to "mesh".
              // First arrow ends at `w + ad`.
              // Middle arrow starts at `0,0` but has a cutout `ad` deep.
              // So Middle's "Body" starts at `ad`.
              // If we place Middle at `x = w`, its `0,0` is at `w`.
              // Its cutout `(0,0) -> (ad, h/2)` will overly the Previous's Tip `(w,0) -> (w+ad, h/2)`.
              // Perfect match.
              // So just place them side-by-side?
              // YES. `width: stepVisualWidth`. The SVG can overflow.
              // We need `overflow: 'visible'` on the View.
              zIndex: index + 10,
              // Wait, if Next is on Top (z > prev),
              // Middle(Transparent Cutout) is on Top of First(Solid Tip).
              // We see First(Solid Tip) through Middle(Cutout).
              // Middle(Stroke) draws the border of Cutout.
              // This is exactly what we want.
            }}>
              <Svg
                width={stepVisualWidth + arrowDepth}
                height={height}
                style={{
                  position: 'absolute',
                  left: 0, // Draw from left edge of this segment
                  top: 0,
                }}
              >
                <Path
                  d={d}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                />
              </Svg>

              {/* Text Overlay */}
              <View style={{
                position: 'absolute',
                top: 0, bottom: 0, left: 0, right: 0,
                justifyContent: 'center', alignItems: 'center',
                paddingLeft: isFirst ? 0 : arrowDepth, // Center visually in the "Body"
                paddingRight: 0
              }}>
                <Text style={{
                  color: textColor,
                  fontWeight: 'bold',
                  fontSize: 12,
                  fontFamily: 'Georgia',
                  textAlign: 'center'
                }}>
                  {label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // --- CONTENT ASSIGNMENT ---
  let content;

  if (stage === -2) {
    // === HOME SCREEN ===
    const activeTaskIdInSlot = grid[currentSlot];
    const liveTask = activeTaskIdInSlot ? tasks.find(t => t.id === activeTaskIdInSlot) : null;

    content = (
      <>
        {/* TOP BAR */}
        <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.profileCircle}><Text style={styles.profileText}>YX</Text></View>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 15, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setStage(-1)}>
              <Ionicons name="book-outline" size={24} color="#4A6741" />
            </TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#2C2B29" />
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.contentContainer}>
          <Text style={[styles.header, { textAlign: isRTL ? 'right' : 'left', fontSize: 32, marginTop: 10 }]}>Performance</Text>

          {/* HORIZONTAL CARDS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardScroll} contentContainerStyle={{ paddingRight: 20 }}>
            <View style={styles.metricCard}>
              <View style={styles.flagIcon}><Text style={{ fontSize: 20 }}>🧘</Text></View>
              <Text style={styles.metricValue}>{deepRatio}</Text>
              <Text style={styles.metricLabel}>Deep/Shallow Ratio</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={styles.flagIcon}><Text style={{ fontSize: 20 }}>🎯</Text></View>
              <Text style={styles.metricValue}>{avgFocus}%</Text>
              <Text style={styles.metricLabel}>Focus Score Avg</Text>
            </View>
          </ScrollView>

          {/* CURRENT TIME-BOX STATUS */}
          <View style={{ marginTop: 0 }}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', marginBottom: 5, fontSize: 18 }]}>Current Time-Box Status</Text>

            {finalizedTimebox ? (
              // FINALIZED STATE - Schedule Locked
              <TouchableOpacity
                style={[styles.glassCard, { borderColor: '#4A6741', backgroundColor: '#F5F9F5', flexDirection: 'row', alignItems: 'center', padding: 16, marginTop: 5 }]}
                onPress={() => setStage(-3)}
                activeOpacity={0.7}
              >
                <Ionicons name="eye-outline" size={28} color="#4A6741" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Georgia', fontSize: 18, fontWeight: 'bold', color: '#4A6741', marginBottom: 4 }}>Schedule Locked</Text>
                  <Text style={{ fontFamily: 'Georgia-Italic', fontSize: 14, color: '#666' }}>View Today's Plan</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4A6741" />
              </TouchableOpacity>
            ) : Object.keys(grid).length === 0 ? (
              // EMPTY STATE
              <View style={[styles.glassCard, { borderColor: '#4A6741', backgroundColor: '#F9FBF9', flexDirection: 'column', alignItems: 'flex-start', padding: 12, marginTop: 5 }]}>
                <Text style={{ fontFamily: 'Georgia', fontSize: 18, color: '#2C2B29', marginBottom: 8 }}>Your grid is empty.</Text>
                <Text style={{ fontFamily: 'Georgia-Italic', fontSize: 14, color: '#888', marginBottom: 15 }}>Ready to box the day?</Text>
                <TouchableOpacity onPress={() => setStage(0)}>
                  <Text style={{ color: '#4A6741', fontWeight: 'bold', textDecorationLine: 'underline' }}>Start Planning →</Text>
                </TouchableOpacity>
              </View>
            ) : liveTask ? (
              // ACTIVE STATE
              <View style={[styles.glassCard, { borderColor: '#4A6741', backgroundColor: '#FFF', flexDirection: 'column', alignItems: 'stretch', padding: 12, marginTop: 5 }]}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontFamily: 'Georgia-Italic', fontSize: 12, color: '#4A6741', textTransform: 'uppercase', letterSpacing: 1 }}>Now Playing</Text>
                  <Text style={{ fontFamily: 'Georgia', fontWeight: 'bold', color: '#2C2B29' }}>Ends {jumpTimeStr}</Text>
                </View>
                <Text style={{ fontFamily: 'Georgia', fontSize: 24, fontWeight: 'bold', color: '#2C2B29', marginBottom: 15 }}>{liveTask.title}</Text>
                <TouchableOpacity
                  style={{ backgroundColor: '#4A6741', padding: 12, borderRadius: 8, alignItems: 'center' }}
                  onPress={() => setStage(2)}
                >
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Resume Session</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // IDLE STATE (Grid exists but no task in current slot)
              <View style={[styles.glassCard, { borderColor: '#DDD', backgroundColor: 'rgba(255,255,255,0.5)', flexDirection: 'column', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, marginTop: 5 }]}>
                <Text style={{ fontFamily: 'Georgia-Italic', fontSize: 15, color: '#888' }}>No task scheduled for {currentSlot}.</Text>
                <TouchableOpacity onPress={() => setStage(2)} style={{ marginTop: 6 }}>
                  <Text style={{ color: '#4A6741', fontWeight: 'bold' }}>View Grid</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* RECENT SESSIONS */}
          <View style={{ marginTop: 5 }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>Recent Sessions</Text>
              <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
            </View>

            {history.length === 0 ? (
              <Text style={{ fontFamily: 'Georgia-Italic', color: '#999', textAlign: 'center', marginTop: 10 }}>No sessions yet.</Text>
            ) : (
              history.slice(0, 3).map((session, idx) => (
                <View key={idx} style={[styles.sessionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={styles.rowIcon}>
                    <Ionicons name={session.focusScore > 80 ? "arrow-up" : "remove"} size={20} color="#555" />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 15, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                    <Text style={styles.rowTitle}>{new Date(session.date).toLocaleDateString()}</Text>
                    <Text style={styles.rowSub}>{session.deepBlocks + session.shallowBlocks} Blocks Completed</Text>
                  </View>
                  <Text style={styles.rowValue}>{session.focusScore}%</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* BOTTOM NAV */}
        <View style={[styles.bottomNav, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => setStage(-2)} style={{ alignItems: 'center' }}>
            <Ionicons name="home" size={24} color="#4A6741" /><Text style={[styles.navText, { color: '#4A6741' }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ alignItems: 'center' }}>
            <Ionicons name="card-outline" size={24} color="#888" /><Text style={styles.navText}>Insights</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStage(0)} style={styles.centerNav}>
            <View style={styles.plusButton}><Ionicons name="add" size={32} color="#FFF" /></View>
          </TouchableOpacity>
          <TouchableOpacity style={{ alignItems: 'center' }}>
            <Ionicons name="people-outline" size={24} color="#888" /><Text style={styles.navText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ alignItems: 'center' }}>
            <Ionicons name="grid-outline" size={24} color="#888" /><Text style={styles.navText}>Manage</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  } else if (stage === -3) {
    // === OVERVIEW PAGE - Read-only zoomed-out view ===
    if (!finalizedTimebox) {
      // Fallback if no finalized timebox
      content = (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontFamily: 'Georgia', fontSize: 18, color: '#666', textAlign: 'center' }}>
            No schedule available. Please create a timebox first.
          </Text>
          <TouchableOpacity onPress={() => setStage(-2)} style={{ marginTop: 20 }}>
            <Text style={{ color: '#4A6741', fontWeight: 'bold' }}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      // Build task blocks from finalized grid
      const buildTaskBlocks = () => {
        const taskBlocks: Array<{
          taskId: string;
          task: any;
          startSlot: string;
          endSlot: string;
          startIndex: number;
          slotsCount: number;
        }> = [];

        let currentBlock: any = null;

        timeSlots.forEach((slot, index) => {
          const taskId = finalizedTimebox.grid[slot];

          if (taskId) {
            if (currentBlock && currentBlock.taskId === taskId) {
              currentBlock.endSlot = slot;
              currentBlock.slotsCount++;
            } else {
              if (currentBlock) {
                taskBlocks.push(currentBlock);
              }
              currentBlock = {
                taskId,
                task: finalizedTimebox.tasks.find((t: any) => t.id === taskId),
                startSlot: slot,
                endSlot: slot,
                startIndex: index,
                slotsCount: 1
              };
            }
          } else {
            if (currentBlock) {
              taskBlocks.push(currentBlock);
              currentBlock = null;
            }
          }
        });

        if (currentBlock) {
          taskBlocks.push(currentBlock);
        }

        return taskBlocks;
      };

      const overviewBlocks = buildTaskBlocks();

      const pastelColors = [
        { bg: '#A8C5DD', border: '#7A9FBF' },
        { bg: '#B8D4B8', border: '#8AAA8A' },
        { bg: '#E6B8B8', border: '#C88A8A' },
        { bg: '#F5E6B3', border: '#D4C080' },
      ];

      const slotHeightOverview = 11.25; // 45px per hour / 4 = 11.25px per 15-min slot

      content = (
        <View style={{ flex: 1 }}>
          {/* Header with Back Button */}
          <View style={{
            paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
            paddingHorizontal: 20,
            paddingBottom: 15,
            backgroundColor: '#FFFBF5',
            borderBottomWidth: 1,
            borderBottomColor: '#E0E0E0'
          }}>
            <TouchableOpacity
              onPress={() => setStage(-2)}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="arrow-back" size={24} color="#4A6741" />
              <Text style={{ fontFamily: 'Georgia', fontSize: 18, fontWeight: 'bold', color: '#4A6741', marginLeft: 8 }}>
                Back to Dashboard
              </Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: 'Georgia', fontSize: 28, fontWeight: 'bold', color: '#2C2B29', marginTop: 15 }}>
              Today's Schedule
            </Text>
            <Text style={{ fontFamily: 'Georgia-Italic', fontSize: 14, color: '#666', marginTop: 4 }}>
              Read-only overview
            </Text>
          </View>

          {/* Zoomed-out Calendar */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 50 }}
            showsVerticalScrollIndicator={true}
          >
            <View style={{ position: 'relative', paddingHorizontal: 10 }}>
              {/* Background Grid */}
              {timeSlots.map((item) => {
                const [h, m] = item.split(':').map(Number);
                const isHourStart = m === 0;

                return (
                  <View
                    key={item}
                    style={{
                      height: slotHeightOverview,
                      flexDirection: 'row',
                      alignItems: 'stretch',
                    }}
                  >
                    {/* Canvas */}
                    <View style={{
                      flex: 0.85,
                      backgroundColor: '#FAFBFC',
                      borderTopWidth: 1,
                      borderTopColor: isHourStart ? '#CCC' : 'rgba(0,0,0,0.03)',
                    }} />

                    {/* Time Axis */}
                    <View style={{
                      flex: 0.15,
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      borderTopWidth: 1,
                      borderTopColor: isHourStart ? '#CCC' : 'rgba(0,0,0,0.03)',
                      backgroundColor: '#FFFBF5'
                    }}>
                      {isHourStart && (
                        <Text style={{
                          fontSize: 9,
                          color: '#666',
                          transform: [{ translateY: -4 }],
                          backgroundColor: '#FFFBF5',
                          paddingHorizontal: 2
                        }}>
                          {`${h}:00`}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Task Blocks Overlay */}
              {overviewBlocks.map((block, blockIndex) => {
                const colorScheme = pastelColors[blockIndex % pastelColors.length];
                const topPosition = block.startIndex * slotHeightOverview;
                const blockHeight = block.slotsCount * slotHeightOverview;

                return (
                  <View
                    key={`block-${block.taskId}-${block.startSlot}`}
                    style={{
                      position: 'absolute',
                      top: topPosition,
                      left: 5,
                      right: '15%',
                      height: blockHeight - 2,
                      backgroundColor: colorScheme.bg,
                      borderLeftWidth: 2,
                      borderLeftColor: colorScheme.border,
                      borderRadius: 2,
                      marginRight: 5,
                      marginTop: 1,
                      padding: 4,
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{
                      color: '#2C2B29',
                      fontSize: 9,
                      fontWeight: 'bold'
                    }} numberOfLines={1}>
                      {block.task?.title || 'Task'}
                    </Text>
                    {blockHeight > 15 && (
                      <Text style={{
                        color: '#666',
                        fontSize: 8,
                        marginTop: 1
                      }}>
                        {block.startSlot}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      );
    }
  } else if (stage === -1) {
    // === INTRO ===
    content = (
      <ScrollView contentContainerStyle={styles.introContentContainer}>
        {/* Language Toggle - Fixed layout for RTL */}
        <View style={{ width: '100%', alignItems: isRTL ? 'flex-start' : 'flex-end', marginBottom: 10, marginTop: 40 }}>
          <TouchableOpacity
            style={styles.langButton}
            onPress={() => setLanguage(language === 'en' ? 'he' : 'en')}
          >
            <Text style={styles.langButtonText}>{text.toggleLabel}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.introHeader, { textAlign }]}>{text.headline}</Text>

        <View style={[styles.separator, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]} />

        <Text style={[styles.introPhilosophy, { textAlign }]}>
          {text.philosophy}
        </Text>
        <Text style={[styles.introPhilosophy, { textAlign }]}>
          {text.philosophy2}
        </Text>

        <View style={styles.benefitsContainer}>
          {text.benefits.map((benefit, i) => (
            <Text key={i} style={[styles.benefitItem, { textAlign }]}>{benefit}</Text>
          ))}
        </View>

        <View style={{ height: 20 }} />

        {/* Steps */}
        <View style={[styles.stepContainer, { flexDirection }]}>
          <Text style={[styles.stepNumber, isRTL ? { marginLeft: 20, marginRight: 0 } : { marginRight: 20 }]}>1</Text>
          <View style={styles.stepTextContainer}>
            <Text style={[styles.stepTitle, { textAlign }]}>{text.step1Title}</Text>
            <Text style={[styles.stepDesc, { textAlign }]}>{text.step1Desc}</Text>
          </View>
        </View>
        <View style={[styles.stepContainer, { flexDirection }]}>
          <Text style={[styles.stepNumber, isRTL ? { marginLeft: 20, marginRight: 0 } : { marginRight: 20 }]}>2</Text>
          <View style={styles.stepTextContainer}>
            <Text style={[styles.stepTitle, { textAlign }]}>{text.step2Title}</Text>
            <Text style={[styles.stepDesc, { textAlign }]}>{text.step2Desc}</Text>
          </View>
        </View>
        <View style={[styles.stepContainer, { flexDirection }]}>
          <Text style={[styles.stepNumber, isRTL ? { marginLeft: 20, marginRight: 0 } : { marginRight: 20 }]}>3</Text>
          <View style={styles.stepTextContainer}>
            <Text style={[styles.stepTitle, { textAlign }]}>{text.step3Title}</Text>
            <Text style={[styles.stepDesc, { textAlign }]}>{text.step3Desc}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.introButton} onPress={() => setStage(0)} activeOpacity={0.8}>
          <Text style={styles.introButtonText}>{text.startBtn}</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  } else if (stage === 0) {
    // === COLLECTION ===
    const taskCount = tasks.length;
    const canProceed = taskCount >= 3;
    const durationOptions = [15, 30, 45, 60, 90, 120];
    content = (
      <View style={{ flex: 1 }}>
        <ProgressBar currentStage={0} />
        <View style={[styles.contentContainer, { marginTop: 10 }]}>
          <Text style={styles.header}>The Collection</Text>
          <Text style={styles.subHeader}>What's on your mind today?</Text>

          <TouchableOpacity style={styles.addButton} onPress={openNewTaskModal} activeOpacity={0.7}>
            <Text style={styles.addButtonText}>+  Capture New Task</Text>
          </TouchableOpacity>

          {/* MODAL */}
          <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{editingTaskId ? 'Refine Task' : 'New Task'}</Text>

                <Text style={styles.label}>Title</Text>
                <TextInput style={styles.input} onChangeText={setNewTaskTitle} value={newTaskTitle} placeholder="e.g. Write Proposal" />

                <Text style={styles.label}>Estimated Time</Text>
                <View style={styles.durationContainer}>
                  {durationOptions.map(d => (
                    <TouchableOpacity key={d} style={[styles.durationOption, newTaskDuration === d && styles.selectedDuration]} onPress={() => setNewTaskDuration(d)}>
                      <Text style={[styles.durationText, newTaskDuration === d && styles.selectedDurationText]}>{d}m</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Location</Text>
                <TextInput style={styles.input} onChangeText={setNewTaskLocation} value={newTaskLocation} placeholder="e.g. Coffee Shop" />

                <Text style={styles.label}>Notes</Text>
                <TextInput style={[styles.input, { height: 80 }]} multiline onChangeText={setNewTaskDescription} value={newTaskDescription} placeholder="Specifics..." />

                <View style={styles.modalButtons}>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelText}>Discard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveTask}>
                    <Text style={styles.saveButtonText}>Save Entry</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <FlatList
            data={tasks}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item, index }) => (
              <View style={styles.glassCard}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <DropCapText text={item.title} size={18} style={styles.taskTitle} />
                    </View>
                    {renderEditButton(item)}
                  </View>
                  <Text style={styles.metaText}>{item.duration} min • {item.location || 'Anywhere'}</Text>
                </View>
                <TouchableOpacity onPress={() => removeTask(item.id)}>
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.primaryButton, !canProceed && styles.disabledButton]}
              onPress={() => canProceed ? setStage(1) : Alert.alert('Three Tasks Required', 'Please add at least 3 tasks to begin selection.')}
              disabled={!canProceed}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{canProceed ? "Next: Selection" : "Add 3 Tasks to Proceed"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  } else if (stage === 1) {
    // === SELECTION ===
    const selectedCount = tasks.filter(t => t.selected).length;
    content = (
      <View style={{ flex: 1 }}>
        <ProgressBar currentStage={1} />
        <View style={[styles.contentContainer, { marginTop: 10 }]}>
          <Text style={styles.header}>The Selection</Text>
          <Text style={styles.subHeader}>Identify your <Text style={{ fontWeight: 'bold', color: '#4A6741' }}>Vital 3</Text> for today.</Text>
          <Text style={styles.counterText}>{selectedCount} / 3 Selected</Text>

          <FlatList
            data={tasks}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.glassCard, item.selected && styles.selectedGlassCard]}
                onPress={() => {
                  if (!item.selected && selectedCount >= 3) {
                    Alert.alert('Limit Reached', 'Focus means saying no. Only 3 allowed.');
                    return;
                  }
                  toggleTask(item.id);
                }}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <DropCapText text={item.title} size={18} style={item.selected ? styles.taskTitleSelected : styles.taskTitle} />
                    </View>
                    {!item.selected && renderEditButton(item)}
                  </View>
                  <Text style={styles.metaText}>{item.duration} min</Text>
                </View>
                {item.selected && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            )}
          />

          <View style={styles.footer}>
            {selectedCount === 3 && (
              <TouchableOpacity style={styles.primaryButton} onPress={() => setStage(2)} activeOpacity={0.8}>
                <Text style={styles.primaryButtonText}>Confirm Priorities</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStage(0)}>
              <Text style={styles.secondaryButtonText}>Revise Collection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  } else if (stage === 2) {
    // === GRID (FIXED HEIGHT MULTI-COLUMN) ===
    const selectedTasks = tasks.filter(t => t.selected);

    const handleFinishDay = () => {
      const completedCount = completedSlots.length;
      const allDone = completedCount === (selectedTasks.reduce((acc, t) => acc + Math.ceil(t.duration / 15), 0));
      Alert.alert(allDone ? 'Day Mastered' : 'Day Concluded', `You completed ${completedCount} blocks.`, [
        { text: 'Start Fresh', style: 'destructive', onPress: () => saveSession() },
        { text: 'Resume', style: 'cancel' }
      ]);
    };

    // Helper: Build task blocks from grid
    const buildTaskBlocks = () => {
      const taskBlocks: Array<{
        taskId: string;
        task: any;
        startSlot: string;
        endSlot: string;
        startIndex: number;
        slotsCount: number;
      }> = [];

      let currentBlock: any = null;

      timeSlots.forEach((slot, index) => {
        const taskId = grid[slot];

        if (taskId) {
          if (currentBlock && currentBlock.taskId === taskId) {
            currentBlock.endSlot = slot;
            currentBlock.slotsCount++;
          } else {
            if (currentBlock) {
              taskBlocks.push(currentBlock);
            }
            currentBlock = {
              taskId,
              task: tasks.find(t => t.id === taskId),
              startSlot: slot,
              endSlot: slot,
              startIndex: index,
              slotsCount: 1
            };
          }
        } else {
          if (currentBlock) {
            taskBlocks.push(currentBlock);
            currentBlock = null;
          }
        }
      });

      if (currentBlock) {
        taskBlocks.push(currentBlock);
      }

      return taskBlocks;
    };

    const taskBlocks = buildTaskBlocks();

    // Pastel color palette
    const pastelColors = [
      { bg: '#A8C5DD', border: '#7A9FBF' }, // Soft Slate Blue
      { bg: '#B8D4B8', border: '#8AAA8A' }, // Muted Sage
      { bg: '#E6B8B8', border: '#C88A8A' }, // Dusty Rose
      { bg: '#F5E6B3', border: '#D4C080' }, // Pale Gold
    ];

    content = (
      <View style={{ flex: 1 }}>
        <ProgressBar currentStage={2} />
        <View style={[styles.contentContainer, { marginTop: 0, paddingBottom: 0, flex: 1 }]}>
          <Text style={styles.header}>The Grid</Text>
          <Text style={styles.subHeader}>Give every task a home.</Text>

          {/* DOCK */}
          <View style={styles.dockContainer}>
            {selectedTasks.map(task => {
              const isScheduled = Object.values(grid).includes(task.id);
              const isActive = activeTaskId === task.id;
              return (
                <TouchableOpacity
                  key={task.id}
                  disabled={isScheduled}
                  style={[styles.dockCard, isActive && styles.activeDockCard, isScheduled && styles.scheduledDockCard]}
                  onPress={() => {
                    setActiveTaskId(isActive ? null : task.id);
                    setSelectedSlot(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dockText, isActive && styles.activeDockText, isScheduled && styles.scheduledDockText]}>
                    {task.title}
                  </Text>
                  <Text style={[styles.dockSubText, isActive && styles.activeDockText]}>{task.duration}m</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CALENDAR GRID */}
          <ScrollView
            style={{ width: '100%', flex: 1, marginBottom: 10 }}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={true}
          >
            <View style={{ position: 'relative' }}>
              {/* BACKGROUND GRID - 15-minute stripes */}
              {timeSlots.map((item) => {
                const [h, m] = item.split(':').map(Number);
                const isHourStart = m === 0;
                const slotHeight = 30;
                const labelText = `${h}:00`;

                return (
                  <TouchableOpacity
                    key={item}
                    style={{
                      height: slotHeight,
                      flexDirection: 'row',
                      alignItems: 'stretch',
                    }}
                    onPress={() => handleSlotPress(item)}
                    activeOpacity={0.8}
                  >
                    {/* LEFT: CANVAS (85%) */}
                    <View style={{
                      flex: 0.85,
                      backgroundColor: '#FAFBFC',
                      borderTopWidth: 1,
                      borderTopColor: isHourStart ? '#CCC' : '#E8E8E8',
                    }} />

                    {/* RIGHT: TIME AXIS (15%) */}
                    <View style={{
                      flex: 0.15,
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      borderTopWidth: 1,
                      borderTopColor: isHourStart ? '#CCC' : '#E8E8E8',
                      backgroundColor: '#FFFBF5'
                    }}>
                      {isHourStart && (
                        <Text style={{
                          fontSize: 11,
                          color: '#666',
                          transform: [{ translateY: -6 }],
                          backgroundColor: '#FFFBF5',
                          paddingHorizontal: 4
                        }}>
                          {labelText}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* SOLID TASK BLOCKS OVERLAY */}
              {taskBlocks.map((block, blockIndex) => {
                const colorScheme = pastelColors[blockIndex % pastelColors.length];
                const topPosition = block.startIndex * 30;
                const blockHeight = block.slotsCount * 30;
                const isCompleted = completedSlots.includes(block.startSlot);
                const isSelected = selectedSlot === block.startSlot;

                return (
                  <TouchableOpacity
                    key={`block-${block.taskId}-${block.startSlot}`}
                    style={{
                      position: 'absolute',
                      top: topPosition,
                      left: 10,
                      right: '15%',
                      height: blockHeight - 4,
                      backgroundColor: isCompleted ? '#2C2B29' : colorScheme.bg,
                      borderLeftWidth: 3,
                      borderLeftColor: isCompleted ? '#000' : colorScheme.border,
                      borderRadius: 4,
                      marginRight: 10,
                      marginTop: 2,
                      padding: 8,
                      justifyContent: 'center',
                      zIndex: 50,
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: '#E00'
                    }}
                    onPress={() => handleSlotPress(block.startSlot)}
                    onLongPress={() => toggleSlotCompletion(block.startSlot)}
                    delayLongPress={300}
                    activeOpacity={0.8}
                  >
                    <Text style={{
                      color: isCompleted ? '#FFF' : '#2C2B29',
                      fontSize: 13,
                      fontWeight: 'bold'
                    }} numberOfLines={2}>
                      {block.task?.title || 'Task'}
                    </Text>
                    <Text style={{
                      color: isCompleted ? '#DDD' : '#666',
                      fontSize: 11,
                      marginTop: 2
                    }}>
                      {block.startSlot} - {block.endSlot}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* CURRENT TIME INDICATOR - Top layer */}
              <View style={{
                position: 'absolute',
                top: (currentH * 120) + (currentM * 2),
                left: 0,
                right: 0,
                zIndex: 100,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <View style={{ flex: 1, height: 2, backgroundColor: '#005BBB' }} />
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#005BBB', marginLeft: -4 }} />
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: 20 }]}>
            <TouchableOpacity
              style={[styles.finishButton, { backgroundColor: '#4A6741' }]}
              onPress={finalizeTimebox}
              activeOpacity={0.8}
            >
              <Text style={styles.finishButtonText}>Finish Day & Lock Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStage(1)}>
              <Text style={styles.secondaryButtonText}>Modify Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  } else if (stage === 10) {
    // === STAGE 1 (COLLECTION) HELP ===
    content = (
      <View style={{ flex: 1 }}>
        <ProgressBar currentStage={0} />
        <View style={[styles.contentContainer, { marginTop: 0 }]}>
          <Text style={styles.header}>The Collection</Text>

          <ScrollView style={{ marginTop: 10, paddingRight: 10 }}>
            {/* 1. The Goal */}
            <Text style={styles.helpHeader}>The Goal</Text>
            <Text style={styles.helpText}>
              Clear your mind by gathering every task, idea, and commitment in one place. This is your space to capture everything—big or small—without worrying about order or timing.
            </Text>

            {/* 2. The Process */}
            <Text style={styles.helpHeader}>The Process</Text>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletTitle}>Dump Everything:</Text>
              <Text style={styles.helpText}>Use the 'Add' button to list every item currently taking up mental space.</Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletTitle}>Don't Filter:</Text>
              <Text style={styles.helpText}>Don't worry about when or how yet. If it’s a thought, it belongs here.</Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletTitle}>Keep it Simple:</Text>
              <Text style={styles.helpText}>Short phrases work best. You can refine the details in the later stages.</Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletTitle}>The Next Step:</Text>
              <Text style={styles.helpText}>Once your mind feels 'empty' and the list feels complete, tap the Collection arrow in the progress bar to move to the Selection stage.</Text>
            </View>

            {/* 3. The Purpose */}
            <View style={styles.purposeBox}>
              <Text style={[styles.helpHeader, { marginTop: 0 }]}>The Purpose</Text>
              <Text style={styles.purposeText}>
                By externalizing your thoughts now, you stop the 'mental loop' of trying to remember them. Transitioning from a cluttered mind to a structured list creates the immediate focus needed for the deep planning that follows.
              </Text>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          <BackButton targetStage={0} />
        </View>
      </View>
    );

  } else if (stage === 11) {
    // === STAGE 1 (PRIORITY/SELECTION) HELP ===
    content = (
      <View style={{ flex: 1 }}>
        <ProgressBar currentStage={1} />
        <View style={[styles.contentContainer, { marginTop: 0 }]}>
          <Text style={styles.header}>The Priority</Text>

          <ScrollView style={{ marginTop: 10, paddingRight: 10 }}>
            {/* The Goal */}
            <Text style={styles.helpHeader}>The Goal</Text>
            <Text style={styles.helpText}>
              Narrow your focus to what truly matters. By separating the 'Must be done' from the 'Should be done,' you protect your energy and ensure your time is spent on your highest-value activities.
            </Text>

            {/* The Process */}
            <Text style={styles.helpHeader}>The Process</Text>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletTitle}>Evaluate the List:</Text>
              <Text style={styles.helpText}>Review the items you gathered in the Collection stage.</Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletTitle}>Make the Cut:</Text>
              <Text style={styles.helpText}>Select only the tasks that align with your objectives for today. Be ruthless—if it isn't essential, leave it for another time.</Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletTitle}>Rank Importance:</Text>
              <Text style={styles.helpText}>Identify your 'Non-Negotiables'—the 1 to 3 items that would make the day a success regardless of what else happens.</Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletTitle}>The Next Step:</Text>
              <Text style={styles.helpText}>Once you have a curated selection of priorities, tap the Priority arrow in the progress bar to begin mapping them onto the Grid.</Text>
            </View>

            {/* The Purpose */}
            <View style={styles.purposeBox}>
              <Text style={[styles.helpHeader, { marginTop: 0 }]}>The Purpose</Text>
              <Text style={styles.purposeText}>
                The power of choice is your greatest tool against overwhelm. By deliberately choosing what not to do, you eliminate the guilt of unfinished tasks. This stage ensures that when you move to the Grid, you aren't just filling time—you are investing it in your priorities.
              </Text>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          <BackButton targetStage={1} />
        </View>
      </View>
    );
  } else if (stage === 12) {
    // === STAGE 2 (GRID) HELP ===
    content = (
      <View style={{ flex: 1 }}>
        <ProgressBar currentStage={2} />
        <View style={[styles.contentContainer, { marginTop: 0 }]}>
          <Text style={styles.header}>The Grid</Text>

          <ScrollView style={{ marginTop: 10, paddingRight: 10 }}>
            {/* The Goal */}
            <Text style={styles.helpHeader}>The Goal</Text>
            <Text style={styles.helpText}>
              To bridge the gap between 'having a list' and 'having a plan.' This is where you claim specific territory in your day for the priorities you’ve chosen, turning abstract intentions into a visual reality.
            </Text>

            {/* The Process */}
            <Text style={styles.helpHeader}>The Process</Text>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletTitle}>Secure the Blocks:</Text>
              <Text style={styles.helpText}>Assign your tasks to specific 15-minute slots. By defining a start and end time, you create a boundary that protects your focus.</Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletTitle}>Respect the Transitions:</Text>
              <Text style={styles.helpText}>Don't just book tasks back-to-back. Use the micro-grid to account for the 'in-between' moments—travel, setup, or a mental reset.</Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletTitle}>Visualize the Load:</Text>
              <Text style={styles.helpText}>Use the multi-column view to spot 'traffic jams' in your day. If a column looks too dense, move a block to a lighter time period.</Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletTitle}>The Next Step:</Text>
              <Text style={styles.helpText}>Once every priority has a home and your timeline feels balanced, tap the Grid chevron to move into the final stage of Refinement.</Text>
            </View>

            {/* The Purpose */}
            <View style={styles.purposeBox}>
              <Text style={[styles.helpHeader, { marginTop: 0 }]}>The Purpose</Text>
              <Text style={styles.purposeText}>
                A list tells you what to do; the Grid tells you when you will actually do it. Mapping your day in high-resolution 15-minute increments eliminates the 'decision fatigue' of wondering what comes next. You are no longer reacting to your day—you are navigating it with a precision-engineered map.
              </Text>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          <BackButton targetStage={2} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Atmosphere />
      {/* Show HomeButton on stages that need it (-1, 0, 1, 2, 3) */}
      {(stage === -1 || stage === 0 || stage === 1 || stage === 2 || stage === 3 || stage === 10 || stage === 11 || stage === 12) && <HomeButton />}
      <ResetGridButton />
      <HelpButton />
      <StatusBar barStyle="dark-content" />
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 10, justifyContent: 'flex-start' },
  contentContainer: { padding: 20, paddingBottom: 100, paddingTop: 10, justifyContent: 'flex-start' }, // Removed flexGrow, added paddingBottom for scroll
  introContentContainer: { padding: 32, paddingBottom: 60, alignItems: 'flex-start' }, // Changed to flex-start for dynamic RTL

  // INTRO
  introHeader: { width: '100%', fontSize: 36, fontFamily: 'Georgia', fontWeight: 'bold', color: '#2C2B29', lineHeight: 44, letterSpacing: 0.5 },
  separator: { width: 60, height: 2, backgroundColor: '#4A6741', marginTop: 30, marginBottom: 30 },

  introPhilosophy: { width: '100%', fontSize: 20, fontFamily: 'Georgia-Italic', color: '#555', lineHeight: 32, marginBottom: 24 },

  benefitsContainer: { width: '100%', marginTop: 10, marginBottom: 30 },
  benefitItem: { fontSize: 16, fontFamily: 'Georgia', color: '#4A6741', marginBottom: 8, letterSpacing: 0.5, fontWeight: '500' },

  introSubHeader: { fontSize: 22, fontFamily: 'Georgia', fontWeight: 'bold', color: '#2C2B29', marginBottom: 30, letterSpacing: 1, textTransform: 'uppercase' },

  stepContainer: { marginBottom: 30, width: '100%', paddingHorizontal: 10, alignItems: 'flex-start' },
  stepNumber: { fontSize: 40, fontFamily: 'Georgia', color: '#E0E0D0', fontWeight: 'bold', marginTop: -5 },
  stepTextContainer: { flex: 1 },
  stepTitle: { fontSize: 18, fontFamily: 'Georgia', fontWeight: 'bold', color: '#2C2B29', marginBottom: 4 },
  stepDesc: { fontSize: 15, fontFamily: 'Georgia-Italic', color: '#666' },

  introButton: { backgroundColor: '#4A6741', paddingVertical: 18, alignItems: 'center', borderRadius: 12, shadowColor: '#4A6741', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, width: '100%' },
  introButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },

  langButton: { padding: 8, backgroundColor: 'rgba(74, 103, 65, 0.1)', borderRadius: 20 },
  langButtonText: { color: '#4A6741', fontSize: 14, fontWeight: 'bold' },

  // HOME
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 25 },
  profileCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E6E0', justifyContent: 'center', alignItems: 'center' },
  profileText: { color: '#4A6741', fontWeight: 'bold' },

  header: { fontSize: 32, fontFamily: 'Georgia', fontWeight: 'bold', color: '#2C2B29', marginBottom: 5 },
  subHeader: { fontSize: 16, fontFamily: 'Georgia-Italic', color: '#666', marginBottom: 25 },

  sectionTitle: { fontSize: 20, fontFamily: 'Georgia', fontWeight: 'bold', color: '#2C2B29', marginBottom: 15 },
  seeAll: { color: '#4A6741', fontSize: 14, fontWeight: 'bold' },

  cardScroll: { marginBottom: 25, flexGrow: 0 },
  metricCard: { width: 140, height: 140, backgroundColor: '#FFF', borderRadius: 16, padding: 15, marginRight: 15, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  flagIcon: { width: 40, height: 40, backgroundColor: '#F5F9F5', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  metricValue: { fontSize: 24, fontWeight: 'bold', color: '#2C2B29', marginBottom: 4 },
  metricLabel: { fontSize: 12, color: '#888', textAlign: 'center' },

  sessionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  rowIcon: { width: 36, height: 36, backgroundColor: '#F0F0F0', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rowTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C2B29' },
  rowSub: { fontSize: 13, color: '#888' },
  rowValue: { fontSize: 16, fontWeight: 'bold', color: '#4A6741' },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 85, backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  navText: { fontSize: 10, color: '#888', marginTop: 4 },
  centerNav: { top: -25 },
  plusButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#4A6741', justifyContent: 'center', alignItems: 'center', shadowColor: '#4A6741', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },

  // COMMON
  glassCard: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#FFF' },
  taskTitle: { fontSize: 16, fontWeight: '500', color: '#2C2B29' },
  taskTitleSelected: { fontSize: 16, fontWeight: 'bold', color: '#4A6741' },
  metaText: { fontSize: 12, color: '#888', marginTop: 4 },
  checkMark: { fontSize: 18, color: '#4A6741', fontWeight: 'bold', marginLeft: 10 },
  deleteText: { fontSize: 18, color: '#999', padding: 5 },

  primaryButton: { backgroundColor: '#2C2B29', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#CCC' },
  secondaryButton: { paddingVertical: 16, alignItems: 'center', marginTop: 5 },
  secondaryButtonText: { color: '#666', fontSize: 16 },

  footer: { marginTop: 20 },
  addButton: { borderWidth: 1, borderColor: '#4A6741', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(74, 103, 65, 0.05)' },
  addButtonText: { color: '#4A6741', fontSize: 16, fontWeight: '600' },
  counterText: { fontSize: 14, color: '#4A6741', fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  selectedGlassCard: { borderColor: '#4A6741', backgroundColor: '#F5F9F5' },

  // EDIT
  editButton: { padding: 8 },
  editButtonText: { fontSize: 16, color: '#888' },

  // DOCK
  dockContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  dockCard: { backgroundColor: '#FFF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  activeDockCard: { borderColor: '#4A6741', backgroundColor: '#4A6741' },
  scheduledDockCard: { opacity: 0.5, backgroundColor: '#F0F0F0', borderColor: 'transparent' },
  dockText: { fontSize: 14, color: '#2C2B29' },
  activeDockText: { color: '#FFF' },
  scheduledDockText: { textDecorationLine: 'line-through', color: '#888' },
  dockSubText: { fontSize: 10, color: '#666', marginTop: 2 },

  // GRID
  gridList: { flex: 1 },
  slotRowContainer: { flexDirection: 'row', marginBottom: 0 },
  timeLabel: { width: 50, fontSize: 12, color: '#999', paddingTop: 8, fontFamily: 'monospace' },
  slotRow: { flex: 1, height: 60, marginBottom: 2 }, // Increased height for visibility
  slotBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 6, justifyContent: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' }, // Slightly taller and more visible
  filledSlot: { backgroundColor: '#4A6741', borderColor: '#4A6741' },
  emptySlot: {},
  completedSlot: { backgroundColor: '#2C2B29', borderColor: '#2C2B29' },
  selectedSlot: { borderColor: '#E00', borderWidth: 2 },
  taskTitleWhite: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  slotDetailsTextWhite: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },
  completedTaskTitle: { color: '#888', textDecorationLine: 'line-through' },
  deleteSlotButton: { position: 'absolute', right: 10, top: 15, width: 30, height: 30, backgroundColor: '#FFF', borderRadius: 15, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  deleteSlotText: { color: '#E00', fontWeight: 'bold' },

  finishButton: { backgroundColor: '#4A6741', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  finishButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  modalTitle: { fontSize: 24, fontFamily: 'Georgia', fontWeight: 'bold', color: '#2C2B29', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, fontSize: 16, color: '#2C2B29' },
  durationContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  durationOption: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#DDD', marginRight: 8, marginBottom: 8 },
  selectedDuration: { backgroundColor: '#4A6741', borderColor: '#4A6741' },
  durationText: { color: '#666' },
  selectedDurationText: { color: '#FFF', fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 30 },
  cancelText: { color: '#888', marginRight: 20, fontSize: 16 },
  saveButton: { backgroundColor: '#2C2B29', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  // HELP STYLES
  helpHeader: { fontSize: 22, fontFamily: 'Georgia', fontWeight: 'bold', color: '#2C2B29', marginTop: 25, marginBottom: 10 },
  helpText: { fontSize: 16, fontFamily: 'Georgia', color: '#444', lineHeight: 24 },
  bulletItem: { marginBottom: 15, paddingLeft: 10 },
  bulletTitle: { fontSize: 16, fontFamily: 'Georgia', fontWeight: 'bold', color: '#4A6741', marginBottom: 4 },
  bulletText: { fontSize: 16, fontFamily: 'Georgia', color: '#444', lineHeight: 24 },
  purposeBox: { backgroundColor: 'rgba(74, 103, 65, 0.08)', padding: 20, borderRadius: 16, marginTop: 30, borderWidth: 1, borderColor: 'rgba(74, 103, 65, 0.1)' },
  purposeText: { fontSize: 16, fontFamily: 'Georgia-Italic', color: '#2C2B29', lineHeight: 26 },
});
