# Persistence Testing Guide

## How to Test Data Persistence

### 1. Open the Application
- Navigate to the Training Modules tab
- You should see the "Persistence Debug Panel" at the top

### 2. Generate Some Modules
- Click "AI Suggestions" to generate training modules
- Or click "New Activity" to create a manual module
- Verify the debug panel shows the modules in "Current State"

### 3. Test Persistence
- Click "Check Storage" in the debug panel
- Verify "Persisted State" matches "Current State"
- The status should show "✅ Data Found"

### 4. Test Browser Refresh
- Refresh the page (F5 or Ctrl+R)
- Check that all modules are still there
- Debug panel should show same counts after refresh

### 5. Test Browser Close/Reopen
- Close the browser tab completely
- Reopen the application
- Navigate to Training Modules tab
- All data should still be present

### 6. Test Module Completion
- Complete a training module
- Check that it moves to completed modules
- Refresh the page - completion should persist

### 7. Test Program Context
- Complete an assessment to get a program
- Check that program info persists after refresh
- Program progress should be maintained

## Expected Console Logs

When working correctly, you should see:
\`\`\`
[NurseStore] Initializing store...
[NurseStore] Starting hydration from localStorage...
[NurseStore] Hydration complete - modules: X
[addTrainingModules] Adding modules: [...]
[addTrainingModules] localStorage verification - stored modules: X
\`\`\`

## Troubleshooting

If data is not persisting:
1. Check browser console for errors
2. Verify localStorage is enabled in browser
3. Check if running in incognito/private mode
4. Use "Clear Storage" button to reset and try again

## Debug Panel Controls

- **Check Storage**: Verifies what's actually saved in localStorage
- **Force Save**: Manually triggers a save operation
- **Clear Storage**: Removes all saved data (requires page refresh)
