# Add Designer

**This command is for the repository owner (Pat Kennedy) only.** It sets up a new designer's folder, their first prototype screen, and their personal branch.

## Steps

1. Ask Pat for:
   - **Designer's full name** (e.g. "Jane Smith")
   - **Short description** of their first prototype (e.g. "Booking flow") — used as the label on the home screen

2. Derive:
   - **designer slug**: lowercase first name only (e.g. "jane")
   - **initials**: first letter of first name + first letter of last name, uppercase (e.g. "JS")
   - **proto slug**: derive from the description — lowercase, spaces to hyphens (e.g. "booking-flow"). If generic, use `proto-1`.
   - **screen name**: `{FirstName}{ProtoSlugPascalCase}` (e.g. `JaneBookingFlow`)

3. Create the prototype folder:
   ```
   src/designers/{slug}/{proto-slug}/
     App.tsx    ← minimal placeholder component
   ```

   Minimal `App.tsx`:
   ```tsx
   import React from 'react';
   import { View, Text, StyleSheet } from 'react-native';

   export default function {FirstName}App() {
     return (
       <View style={styles.container}>
         <Text style={styles.text}>{First Name}'s Prototype</Text>
       </View>
     );
   }

   const styles = StyleSheet.create({
     container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f9ff' },
     text: { fontSize: 20, fontWeight: '600', color: '#1a1a2e' },
   });
   ```

4. Register the screen in `src/navigation/AppNavigator.tsx`:
   - Add `{ScreenName}: undefined` to the `RootParamList` type
   - Import the component
   - Add `<Stack.Screen name="{ScreenName}" component={...} options={{ title: '{description}', headerBackTitle: 'Playground', headerStyle: { backgroundColor: '#006add' }, headerTintColor: '#ffffff', headerTitleStyle: { fontWeight: '600' } }} />`

5. Add the linking entry in `App.tsx`:
   ```ts
   {ScreenName}: '{slug}/{proto-slug}',
   ```

6. Add the designer card to `src/HomeScreen.tsx` in the `designers` array, **in alphabetical order by first name**:
   ```ts
   {
     name: '{Full Name}',
     initials: '{INITIALS}',
     prototypes: [{ screenName: '{ScreenName}', label: '{description}' }],
   },
   ```

7. Stage and commit on `main`:
   ```
   git add src/designers/{slug}/ src/navigation/AppNavigator.tsx src/HomeScreen.tsx App.tsx
   git commit -m "Add {Full Name} as designer"
   git push
   ```

8. Create the designer's personal branch:
   ```
   git checkout -b {slug}
   git push -u origin {slug}
   git checkout main
   ```

9. Confirm to Pat:
   - Playground URL: `https://sm-native.herokuapp.com/`
   - Designer's branch: `{slug}`
   - Files in `src/designers/{slug}/{proto-slug}/`
