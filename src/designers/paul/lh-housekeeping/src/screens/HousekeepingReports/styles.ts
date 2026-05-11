import { Dimensions, StyleSheet } from 'react-native';
import { COLORS } from '../../config/colors';
import { ORANGE } from './types';

export const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#f2f3f3' },

  // Header
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  headerTop:    { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  headerBottom: { flexDirection: 'row', alignItems: 'flex-end' },
  header: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerLabel:   { fontSize: 16, color: '#333', fontWeight: '600', position: 'absolute', left: 0, right: 0, textAlign: 'center' },
  headerDate:    { fontSize: 22, fontFamily: 'ValueSerifTrial-Medium', color: '#111', marginTop: 2, lineHeight: 30 },
  clearBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 4, alignSelf: 'center' },
  clearBtnText:  { fontSize: 13, color: '#9ca3af' },
  printBtn:      { padding: 4, marginLeft: 8 },
  sortToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: '#f2f3f3',
  },
  sortBtn:             { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortBtnText:         { fontSize: 13, color: ORANGE, fontWeight: '600' },
  sortToolbarSep:      { width: 1, height: 14, backgroundColor: '#d1d5db', marginHorizontal: 4 },
  sortToolbarPrint:    { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 6, marginRight: 16 },
  sortToolbarPrintText:{ fontSize: 13, color: ORANGE, fontWeight: '600' },
  demoBtn:             { flexDirection: 'row', alignItems: 'center' },
  demoBtnText:         { fontSize: 13, color: '#6b7280', fontWeight: '500' },

  // Filter button
  filterBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 6 },
  filterBtnText:   { fontSize: 13, color: ORANGE, fontWeight: '600' },
  filterBadge:     { minWidth: 16, height: 16, borderRadius: 8, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  filterBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  // Filter sheet
  filterSection:      { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  filterSectionLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', letterSpacing: 0.8, marginBottom: 16 },
  filterChipRow:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  segmentedControl: {
    flexDirection: 'row', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 3,
  },
  segmentedSegment:       { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segmentedSegmentActive: { borderWidth: 2, borderColor: '#111' },
  segmentedText:          { fontSize: 15, color: '#6b7280', fontWeight: '400' },
  segmentedTextActive:    { color: '#111', fontWeight: '600' },
  filterChip:         { borderWidth: 1, borderRadius: 4, paddingHorizontal: 16, height: 34, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  filterChipActive:   { borderColor: '#ff6842', backgroundColor: '#fff5ee' },
  filterChipInactive: { borderColor: '#ccd1d1', backgroundColor: '#fff' },
  filterChipText:     { fontSize: 14, fontWeight: '400' },

  // Demo flags sheet
  demoFlagRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  demoFlagLabel: { fontSize: 15, color: '#111', flex: 1, marginRight: 16 },

  // Controls row
  controlsRow: {
    flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1,
    borderColor: '#e5e7eb', alignItems: 'center', height: 62,
  },

  // Date strip
  stripContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', height: '100%' },
  arrow:          { width: 22, alignItems: 'center' },
  arrowText:      { fontSize: 20, color: '#9ca3af', lineHeight: 24 },
  dayBtn:         { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dayLabel:       { fontSize: 9, color: '#9ca3af', fontWeight: '600', letterSpacing: 0.4 },
  dayNum:         { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 1 },
  activeText:     { color: ORANGE },
  dayUnderline:   { height: 2, width: 16, backgroundColor: ORANGE, borderRadius: 1, marginTop: 2 },

  // Divider
  verticalDivider: { width: 1, height: '60%', backgroundColor: '#e5e7eb' },

  // Select dates button
  selectDatesBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8 },
  selectDatesText: { fontSize: 13, color: ORANGE, fontWeight: '600' },

  // Room rows
  row: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 8,
    borderWidth: 1, borderColor: '#E5E8E8',
    paddingHorizontal: 12, paddingTop: 20, paddingBottom: 0, overflow: 'hidden',
  },
  rowTop:  { flexDirection: 'row', alignItems: 'flex-start' },
  rowLeft: { flex: 1, gap: 4 },
  rowRight:{ flexDirection: 'row', gap: 24, alignItems: 'center' },
  cardDivider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: -16, marginTop: 12 },

  // Notes area
  noteArea:           { marginTop: 16, borderTopWidth: 1, borderColor: '#F2F2F7', marginHorizontal: -12, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  guestCommentsLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600' as const, flexShrink: 0 },
  staffNoteLabel:     { fontSize: 11, color: '#9ca3af', fontWeight: '600' as const, fontStyle: 'normal' as const },
  guestCommentsText:  { fontSize: 12, color: '#9ca3af', fontStyle: 'italic' as const },
  noteActionRow:      { flexDirection: 'row', alignItems: 'stretch' },
  noteRow:            { flex: 1, height: 24, justifyContent: 'center' },
  noteAssignDivider:  { width: 1, alignSelf: 'stretch', backgroundColor: '#e5e7eb', marginHorizontal: 12 },
  noteDivider:        { width: 1, alignSelf: 'stretch', backgroundColor: '#e5e7eb', marginHorizontal: 12 },
  extrasSection:      { flex: 0.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  extrasCount:        { fontSize: 12, fontWeight: '700' as const, color: '#374151' },
  extrasLabel:        { fontSize: 12, fontWeight: '600' as const, color: '#9ca3af' },
  statLabel:          { fontSize: 12, color: '#9ca3af', fontWeight: '500' as const },
  statValue:          { fontSize: 14, fontWeight: '700' as const, color: '#111827' },
  noteActionDivider:  { width: 1, height: 16, backgroundColor: '#d1d5db', marginHorizontal: 8 },
  assignBtn:          { width: 80, height: 24, alignItems: 'flex-end', justifyContent: 'center' },
  assignBtnText:      { fontSize: 12, color: ORANGE, fontWeight: '700', textAlign: 'right' },
  noteText:           { fontSize: 12, color: '#9ca3af', fontStyle: 'italic' as const },
  editNoteBtn:        { paddingLeft: 4 },
  editNoteBtnText:    { fontSize: 13, color: ORANGE, fontWeight: '600' },
  addNoteText:        { fontSize: 12, color: ORANGE, fontWeight: '700' },

  // Notes input
  notesInput: {
    flex: 1, margin: 16, padding: 14, backgroundColor: '#f9fafb',
    borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb',
    fontSize: 15, color: '#111', lineHeight: 22,
  },
  roomTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  roomNumber:   { fontSize: 16, fontWeight: '600', color: '#212323' },
  roomTitleSep: { width: 2, height: 2, borderRadius: 1, backgroundColor: '#9ca3af' },
  roomType:     { fontSize: 11, fontWeight: '700', color: '#9BA0A0' },

  // Guest info section
  guestInfoSection:  { marginTop: 12 },
  guestNameText:     { fontSize: 12, fontWeight: '400', color: '#333333' },
  reservationIdText: { fontSize: 12, color: '#333333' },
  guestDatesRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  guestBadgeRow:     { flexDirection: 'row', gap: 4, marginTop: 16 },
  guestDatesText:    { fontSize: 12, color: '#111' },
  lateCheckoutBadge: {
    backgroundColor: '#FFE2D7', borderRadius: 999, paddingHorizontal: 8, alignSelf: 'flex-start',
  },
  lateCheckoutText:  { fontSize: 11, fontWeight: '600', color: '#FF6842', letterSpacing: -0.1, lineHeight: 20 },
  standardBadge: {
    backgroundColor: COLORS.Background.Brown, borderRadius: 999, paddingHorizontal: 8, alignSelf: 'flex-start',
  },
  standardBadgeText:           { fontSize: 11, fontWeight: '600', color: COLORS.Black[400], letterSpacing: -0.1, lineHeight: 20 },
  notesSheetSectionLabel:      { fontSize: 11, fontWeight: '700' as const, color: COLORS.Black[500], letterSpacing: 0.5, textTransform: 'uppercase' as const, marginBottom: 8 },
  notesSheetBody:              { fontSize: 14, color: COLORS.Black[200], lineHeight: 21 },
  notesSheetDivider:           { height: 1, backgroundColor: COLORS.Background.Stroke, marginVertical: 20 },
  notesSheetInput: {
    borderWidth: 1, borderColor: COLORS.Background.Stroke, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: COLORS.Black[200], lineHeight: 21,
    minHeight: 80, textAlignVertical: 'top' as const,
  },
  notesSheetSaveRow:    { flexDirection: 'row' as const, justifyContent: 'flex-end' as const, alignItems: 'center' as const, gap: 16, marginTop: 12 },
  notesSheetCancel:     { fontSize: 14, color: COLORS.Black[400] },
  notesSheetSaveBtn:    { backgroundColor: ORANGE, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 },
  notesSheetSaveBtnText:{ fontSize: 14, fontWeight: '600' as const, color: '#fff' },

  // Bed config
  bedConfigRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  bedConfigLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  bedConfigPipe:  { width: 1, height: 14, backgroundColor: '#d1d5db' },
  bedConfigBadge: { flexDirection: 'row', alignItems: 'center' },
  bedConfigText:  { fontSize: 12, color: '#111' },
  occupancyRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  occupancyLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  occupancyItem:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  occupancyCount: { fontSize: 12, color: COLORS.Black[200], fontWeight: '400' },
  unoccupiedText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },

  // Symbol container styles — all 30×30 so every icon sits in the same footprint
  symbolCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  symbolSquare: { width: 30, height: 30, borderRadius: 8,  alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  symbolChip:   { height: 30, borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },

  badge:            { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeInteractive: { flexDirection: 'row', alignItems: 'center', height: 40, paddingLeft: 4, paddingRight: 8 },
  badgeText:        { fontSize: 11, fontWeight: '600' },
  badgeNeutral:     { backgroundColor: '#f3f4f6', borderRadius: 8 },

  // Figma pill-style cleaning status button
  cleaningBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 34, borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, overflow: 'hidden',
  },
  cleaningBtnText:     { fontSize: 12, fontWeight: '700', lineHeight: 16 },
  occupancyStatusText: { fontSize: 12, fontWeight: '700' },

  // Status dropdown
  dropdownOverlay: { flex: 1 },
  dropdownCard: {
    position: 'absolute', backgroundColor: '#fff', borderRadius: 10, minWidth: 170, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 10, elevation: 10,
  },
  dropdownItem:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
  dropdownItemActive: { backgroundColor: '#fef9f5' },
  dropdownItemText:   { fontSize: 14, fontWeight: '500' },
  dropdownDivider:    { height: 1, backgroundColor: '#f3f4f6' },

  separator:         { height: 1, backgroundColor: '#f3f4f6' },
  errorText:         { textAlign: 'center', color: 'red', marginTop: 40 },
  emptyText:         { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  sectionHeader:     { backgroundColor: '#f2f3f3', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  sectionHeaderText: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 0.8 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#e5e7eb',
  },
  modalTitle:       { fontSize: 16, fontWeight: '700', color: '#111' },
  dateModalHelper:  { fontSize: 12, color: '#9ca3af', textAlign: 'center', paddingTop: 16, paddingBottom: 12 },

  // Date fields
  dateField:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#fff' },
  dateFieldActive:      { backgroundColor: '#fef9f5' },
  dateFieldLeft:        { flex: 1 },
  dateFieldLabel:       { fontSize: 11, color: '#9ca3af', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  dateFieldValue:       { fontSize: 16, fontWeight: '600', color: '#111' },
  dateFieldPlaceholder: { color: '#d1d5db', fontWeight: '400' },
  fieldDivider:         { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },

  // Sort direction toggle
  sortDirToggle: { padding: 6, marginLeft: 0, marginRight: -2 },

  // Bottom sheet (shared)
  sortSheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sortSheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 36 },
  sortSheetHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: '#d1d5db' },
  sheetHandleArea:  { width: '100%', paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  sortSheetHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 0, paddingBottom: 12 },
  sortSheetTitle:   { fontSize: 18, fontWeight: '600', color: COLORS.Black[200] },
  sortResetText:    { fontSize: 14, color: ORANGE, fontWeight: '600' },
  sortOptionRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  sortOptionRowActive: { backgroundColor: '#fef9f5' },
  sortRadio:        { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  sortRadioActive:  { borderColor: ORANGE },
  sortRadioDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },
  sortOptionLabel:  { fontSize: 16, color: '#374151' },
  sortOptionLabelActive: { color: ORANGE, fontWeight: '600' },

  // Modal footer
  modalFooter:      { padding: 16, borderTopWidth: 1, borderColor: '#e5e7eb' },
  applyBtn:         { backgroundColor: ORANGE, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  applyBtnDisabled: { backgroundColor: '#f3f4f6' },
  applyBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Print preview
  printPreviewSafe:        { flex: 1, backgroundColor: '#f2f3f3' },
  printPreviewHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  printPreviewHeaderTitle: { fontSize: 13, fontWeight: '600', color: '#111' },
  printPreviewScroll:      { padding: 12, alignItems: 'center' },
  printDoc: {
    backgroundColor: '#fff',
    width: Dimensions.get('window').width - 24,
    minHeight: (Dimensions.get('window').width - 24) * (297 / 210),
    padding: (Dimensions.get('window').width - 24) * 0.08,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    elevation: 4, marginBottom: 12,
  },
  printDocTitle:          { fontSize: 11, fontWeight: '700', color: '#111' },
  printDocDate:           { fontSize: 7.5, color: '#6b7280', marginTop: 2 },
  printDocDivider:        { height: 0.5, backgroundColor: '#9ca3af', marginVertical: 8 },
  printTableHeader:       { flexDirection: 'row', paddingVertical: 4, gap: 6, borderBottomWidth: 0.5, borderColor: '#374151', marginBottom: 1 },
  printTableHeaderCell:   { fontSize: 6.5, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.3 },
  printTableRow:          { paddingVertical: 5, borderBottomWidth: 0.5, borderColor: '#e5e7eb' },
  printTableRowCols:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  printTableRowAlt:       {},
  printTableCell:         { fontSize: 7.5, color: '#374151' },
  printTableCellBold:     { fontWeight: '700', color: '#111' },
  printStatusBadge:       { borderRadius: 2, paddingHorizontal: 4, paddingVertical: 1, alignSelf: 'flex-start' },
  printStatusText:        { fontSize: 7, fontWeight: '600' },
  printNoteRow:           { width: '100%', paddingTop: 2, paddingLeft: 1 },
  printNotesContainer:    { marginTop: 4, backgroundColor: '#f3f4f6', borderRadius: 2, paddingHorizontal: 6, paddingVertical: 4, gap: 2 },
  printNoteText:          { fontSize: 6.5, color: '#6b7280', fontStyle: 'italic' },
  printNoteLabel:         { fontWeight: '700', fontStyle: 'normal' },
  printSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  printSheetHeader:      { alignItems: 'center', paddingTop: 10, paddingBottom: 14, paddingHorizontal: 16 },
  printSheetHandlePill:  { width: 36, height: 4, backgroundColor: '#d1d5db', borderRadius: 2, marginBottom: 12 },
  printSheetTitleRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14 },
  printSheetTitleText:   { fontSize: 16, fontWeight: '700', color: '#111' },
  printSheetPageCount:   { fontSize: 14, color: '#6b7280' },
  printSheetDivider:     { height: 1, backgroundColor: '#e5e7eb' },
  printSettingsRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  printSettingsLabel:    { fontSize: 14, color: '#111' },
  printSettingsSelect:   { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7, minWidth: 150 },
  printSettingsSelectText: { flex: 1, fontSize: 13, color: '#374151' },
  printSettingsDivider:  { height: 1, backgroundColor: '#e5e7eb', marginVertical: 2 },
  printCheckRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  printCheckbox:         { width: 18, height: 18, borderWidth: 1.5, borderColor: '#9ca3af', borderRadius: 3, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  printCheckboxChecked:  { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  printCheckLabel:       { fontSize: 13, color: '#374151' },
  printExternalRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11 },
  printExternalText:     { fontSize: 13, color: '#374151' },
  printPreviewFooter:    { paddingTop: 12, paddingHorizontal: 12, borderTopWidth: 1, borderColor: '#e5e7eb' },
  printConfirmBtn:       { backgroundColor: '#111', borderRadius: 8, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  printConfirmBtnText:   { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Automations sheet
  autoSheetSubtitle: { fontSize: 13, color: '#6b7280', paddingHorizontal: 20, paddingBottom: 16, lineHeight: 18 },
  autoSection:       { paddingHorizontal: 20, paddingBottom: 16 },
  autoSectionTitle:  { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 4 },
  autoSectionDesc:   { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 12 },
  autoInputRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  autoInput:         { width: 72, height: 36, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 10, fontSize: 15, color: '#111', backgroundColor: '#fff' },
  autoInputSuffix:   { fontSize: 14, color: '#6b7280' },
  autoSeparator:     { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 20, marginBottom: 4 },
  autoCheckRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  autoCheckLabel:    { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 2 },
  autoCheckDesc:     { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  autoFooter:        { paddingHorizontal: 20, paddingTop: 8 },
  filterSaveFooter:  { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  autoDoneBtn:       { backgroundColor: '#e8722a', borderRadius: 8, height: 44, alignItems: 'center', justifyContent: 'center' },
  autoDoneBtnText:   { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Pagination controls
  paginationRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 24, gap: 20, backgroundColor: '#f2f3f3',
  },
  pageBtn: { padding: 8, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  pageIndicator: { fontSize: 13, fontWeight: '600' as const, color: '#374151', minWidth: 90, textAlign: 'center' },
});
