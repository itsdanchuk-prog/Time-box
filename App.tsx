import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, SafeAreaView, Platform, StatusBar, Button, Alert, Modal, ScrollView, I18nManager } from 'react-native';
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
    toggleLabel: 'עברית', // Button shows target language
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
  // --- STATE ---
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

  // Store Hooks
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

  // Language
  const language = useStore((state) => state.language);
  const setLanguage = useStore((state) => state.setLanguage);

  const text = translations[language];
  const isRTL = language === 'he';
  const textAlign = isRTL ? 'right' : 'left';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // --- GEN 15-MIN GRID ---
  const timeSlots: string[] = [];
  for (let h = 7; h <= 22; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 22 && m > 0) break;
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

    // DELETE MODE
    if (existingTaskId) {
      if (selectedSlot === time) setSelectedSlot(null);
      else setSelectedSlot(time);
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

  // --- ATMOSPHERE COMPONENT ---
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

  // --- RENDER HELPERS ---
  const renderEditButton = (task: any) => (
    <TouchableOpacity
      style={styles.editButton}
      onPress={() => openEditTaskModal(task)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.editButtonText}>✎</Text>
    </TouchableOpacity>
  );

  if (stage === -1) {
    return (
      <SafeAreaView style={styles.container}>
        <Atmosphere />
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.introContentContainer}>

          {/* Language Toggle */}
          <View style={{ width: '100%', alignItems: 'flex-end', marginBottom: 10 }}>
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
      </SafeAreaView>
    );
  }

  if (stage === 0) {
    const taskCount = tasks.length;
    const canProceed = taskCount >= 3;
    const durationOptions = [15, 30, 45, 60, 90, 120];

    return (
      <SafeAreaView style={styles.container}>
        <Atmosphere />
        <StatusBar barStyle="dark-content" />
        <View style={styles.contentContainer}>
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
      </SafeAreaView>
    );
  }

  if (stage === 1) {
    const selectedCount = tasks.filter(t => t.selected).length;
    return (
      <SafeAreaView style={styles.container}>
        <Atmosphere />
        <View style={styles.contentContainer}>
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
      </SafeAreaView>
    );
  }

  if (stage === 2) {
    const selectedTasks = tasks.filter(t => t.selected);

    const handleFinishDay = () => {
      const completedCount = completedSlots.length;
      const allDone = completedCount === (selectedTasks.reduce((acc, t) => acc + Math.ceil(t.duration / 15), 0));
      Alert.alert(allDone ? 'Day Mastered' : 'Day Concluded', `You completed ${completedCount} blocks.`, [
        { text: 'Start Fresh', style: 'destructive', onPress: () => resetGrid() },
        { text: 'Resume', style: 'cancel' }
      ]);
    };

    return (
      <SafeAreaView style={styles.container}>
        <Atmosphere />
        <View style={styles.contentContainer}>
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

          {/* 15 MIN GRID */}
          <FlatList
            data={timeSlots}
            keyExtractor={item => item}
            extraData={{ grid, selectedSlot, completedSlots }}
            style={styles.gridList}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item, index }) => {
              const taskId = grid[item];
              const task = taskId ? tasks.find(t => t.id === taskId) : null;
              const isCompleted = completedSlots.includes(item);
              const isSelected = selectedSlot === item;

              const prevTime = timeSlots[index - 1];
              const nextTime = timeSlots[index + 1];
              const prevTaskId = prevTime ? grid[prevTime] : null;
              const nextTaskId = nextTime ? grid[nextTime] : null;

              const isStart = taskId && taskId !== prevTaskId;
              const isSingle = taskId && taskId !== prevTaskId && taskId !== nextTaskId;

              const mergedStyle = [];
              if (taskId) {
                if (isStart || isSingle) {
                  mergedStyle.push({ borderTopLeftRadius: 6, borderTopRightRadius: 6, marginTop: 4 });
                }
                const isEnd = taskId && taskId !== nextTaskId;
                if (isEnd) {
                  mergedStyle.push({ borderBottomLeftRadius: 6, borderBottomRightRadius: 6, marginBottom: 4 });
                }
              }

              const containerStyle = [];
              if (taskId && taskId === nextTaskId) {
                containerStyle.push({ marginBottom: 0 });
              } else {
                containerStyle.push({ marginBottom: 0 });
              }

              const showContent = isStart || isSingle;

              return (
                <View style={[styles.slotRowContainer, containerStyle]}>
                  <Text style={styles.timeLabel}>{item}</Text>
                  <TouchableOpacity
                    style={styles.slotRow}
                    onPress={() => handleSlotPress(item)}
                    onLongPress={() => taskId && toggleSlotCompletion(item)}
                    delayLongPress={300}
                    activeOpacity={0.9}
                  >
                    <View style={[
                      styles.slotBox,
                      task ? styles.filledSlot : styles.emptySlot,
                      isCompleted && styles.completedSlot,
                      isSelected && styles.selectedSlot,
                      ...mergedStyle
                    ]}>
                      {task ? (
                        <View>
                          {showContent && (
                            <View>
                              <Text style={[
                                isCompleted ? styles.completedTaskTitle : styles.taskTitleWhite,
                                { fontSize: 14, fontFamily: 'Georgia', fontWeight: 'bold', letterSpacing: 0.5 }
                              ]}>
                                {task.title}
                              </Text>
                              {(task.description || task.location) && (
                                <Text style={styles.slotDetailsTextWhite} numberOfLines={1}>
                                  {task.location ? `${task.location} ` : ''}
                                  {task.description ? `— ${task.description}` : ''}
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      ) : (
                        <View />
                      )}
                    </View>
                  </TouchableOpacity>

                  {isSelected && task && (
                    <TouchableOpacity style={styles.deleteSlotButton} onPress={() => {
                      removeTaskInstance(taskId);
                      setSelectedSlot(null);
                    }}>
                      <Text style={styles.deleteSlotText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.finishButton} onPress={handleFinishDay} activeOpacity={0.8}>
              <Text style={styles.finishButtonText}>Finish Day</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStage(1)}>
              <Text style={styles.secondaryButtonText}>Modify Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  contentContainer: { flex: 1, padding: 24, paddingBottom: 0 },
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
  stepDesc: { fontSize: 16, fontFamily: 'Georgia-Italic', color: '#777', lineHeight: 26 },

  introButton: {
    backgroundColor: '#4A6741',
    width: '100%',
    paddingVertical: 22,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#4A6741',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  introButtonText: { color: '#FDFBF7', fontFamily: 'Georgia', fontSize: 18, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase' },

  // Lang Button
  langButton: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#D0D0C0', borderRadius: 20 },
  langButtonText: { fontSize: 12, fontFamily: 'Georgia', color: '#888' },

  // GLOBAL HEADERS
  header: { fontSize: 42, fontFamily: 'Georgia', color: '#2C2B29', marginBottom: 8, marginTop: 10, letterSpacing: -0.5 },
  subHeader: { fontSize: 18, fontFamily: 'Georgia-Italic', color: '#888', marginBottom: 25 },
  counterText: { fontSize: 14, fontFamily: 'Georgia', color: '#4A6741', fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },

  // CARDS (Glassmorphism)
  glassCard: {
    flexDirection: 'row',
    padding: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Translucent
    marginBottom: 16,
    borderRadius: 16, // Softer curves
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Floating Shadow
    shadowColor: '#9E9E96',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 3,
  },
  selectedGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: '#4A6741',
    borderWidth: 1.5,
  },

  // TEXT
  taskTitle: { color: '#2C2B29', fontSize: 18 },
  taskTitleSelected: { color: '#4A6741', fontWeight: 'bold' },
  taskTitleWhite: { color: '#FFF' },
  completedTaskTitle: { color: 'rgba(255,255,255,0.7)', textDecorationLine: 'line-through' },
  metaText: { fontSize: 13, fontFamily: 'Georgia-Italic', color: '#999', marginTop: 6 },
  slotDetailsTextWhite: { fontSize: 12, fontFamily: 'Georgia-Italic', color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  checkMark: { color: '#4A6741', fontSize: 20 },
  deleteText: { color: '#CCC', fontSize: 20, padding: 8 },

  editButton: { marginLeft: 10, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(74, 103, 65, 0.05)', borderRadius: 12 },
  editButtonText: { fontSize: 14, color: '#4A6741' },

  // BUTTONS
  addButton: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D0D0C0',
    borderStyle: 'dashed',
    borderRadius: 12
  },
  addButtonText: { color: '#888', fontFamily: 'Georgia', fontSize: 16, fontStyle: 'italic' },

  primaryButton: {
    backgroundColor: '#2C2B29', // Deep charcoal/black
    padding: 22,
    borderRadius: 4,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5
  },
  primaryButtonText: { color: '#FFF', fontFamily: 'Georgia', fontSize: 16, fontWeight: 'bold', letterSpacing: 1.5, textTransform: 'uppercase' },
  disabledButton: { backgroundColor: '#BBBBB0', shadowOpacity: 0 },

  secondaryButton: { padding: 15, alignItems: 'center', marginTop: 10 },
  secondaryButtonText: { color: '#999', fontFamily: 'Georgia', fontSize: 14, textDecorationLine: 'underline' },

  finishButton: { backgroundColor: '#4A6741', padding: 22, borderRadius: 4, alignItems: 'center', marginBottom: 10 },
  finishButtonText: { color: '#FFF', fontFamily: 'Georgia', fontSize: 16, fontWeight: 'bold', letterSpacing: 1.5, textTransform: 'uppercase' },

  footer: { marginTop: 20, marginBottom: 50 },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(255,251,245,0.95)', justifyContent: 'center', padding: 30 },
  modalContent: { backgroundColor: '#FFF', padding: 30, borderRadius: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 30, elevation: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  modalTitle: { fontSize: 26, fontFamily: 'Georgia', color: '#2C2B29', marginBottom: 25, textAlign: 'center', letterSpacing: 0.5 },
  label: { fontFamily: 'Georgia', fontSize: 12, color: '#888', marginBottom: 8, marginTop: 15, letterSpacing: 1, textTransform: 'uppercase' },
  input: { backgroundColor: '#FAFAFA', borderBottomWidth: 1, borderBottomColor: '#DDD', padding: 12, fontSize: 18, fontFamily: 'Georgia', color: '#333' },
  saveButton: { backgroundColor: '#2C2B29', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 2 },
  saveButtonText: { color: '#FFF', fontFamily: 'Georgia', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  cancelText: { color: '#999', fontFamily: 'Georgia', fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 },

  durationContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  durationOption: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE' },
  selectedDuration: { backgroundColor: '#4A6741', borderColor: '#4A6741' },
  durationText: { color: '#999', fontSize: 14, fontFamily: 'Georgia' },
  selectedDurationText: { color: '#FFF', fontWeight: 'bold' },

  // GRID
  dockContainer: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  dockCard: { flex: 1, padding: 16, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: '#EAEAEA', borderRadius: 8, alignItems: 'center' },
  activeDockCard: { borderColor: '#4A6741', borderWidth: 1, backgroundColor: '#FFF' },
  scheduledDockCard: { opacity: 0.4 },
  dockText: { fontSize: 13, fontFamily: 'Georgia', fontWeight: 'bold', color: '#2C2B29', textAlign: 'center' },
  dockSubText: { fontSize: 11, fontFamily: 'Georgia-Italic', color: '#999', marginTop: 4 },
  activeDockText: { color: '#4A6741' },
  scheduledDockText: { textDecorationLine: 'line-through' },

  gridList: { flex: 1, marginTop: 10 },
  slotRowContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  timeLabel: { width: 55, fontSize: 12, fontFamily: 'Georgia-Italic', color: '#AAA', marginTop: 0, textAlign: 'right', paddingRight: 15, paddingTop: 12 },
  slotRow: { flex: 1 },
  slotBox: {
    minHeight: 46,
    borderLeftWidth: 1,
    borderLeftColor: '#EAEAEA',
    padding: 12,
    justifyContent: 'center',
  },
  emptySlot: { backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: '#F5F5F0', borderStyle: 'solid' },
  filledSlot: { backgroundColor: '#4A6741', borderRadius: 0, marginVertical: 0, borderBottomWidth: 0 },
  completedSlot: { backgroundColor: '#9BAFA0' },
  selectedSlot: { backgroundColor: '#F9F5EC' },

  deleteSlotButton: { marginLeft: 10, justifyContent: 'center' },
  deleteSlotText: { color: '#CCC', fontSize: 18 },
});
