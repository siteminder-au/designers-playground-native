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

4. Write the designer metadata file `src/designers/{slug}/designer.json`:
   ```json
   {
     "name": "{Full Name}",
     "initials": "{INITIALS}"
   }
   ```
   The home screen lists designers alphabetically by name automatically.

5. Write the prototype metadata file `src/designers/{slug}/{proto-slug}/prototype.json`:
   ```json
   {
     "label": "{description}",
     "order": 0
   }
   ```
   The screen, its deep-link path (`{slug}/{proto-slug}`) and the home-screen card are
   auto-discovered from the folder + this file. **Do not edit `src/navigation/AppNavigator.tsx`,
   `App.tsx`, or `src/HomeScreen.tsx`** — they are shared infrastructure and adding a prototype
   no longer touches them.
   - By default the prototype shows the standard blue native header (title = `label`). If the
     prototype renders its own chrome and you want no header, add `"headerShown": false`.

6. Stage and commit the new files on `main`, then push:
   ```
   git add src/designers/{slug}/
   git commit -m "Add {Full Name} as designer"
   git push
   ```

7. Create the designer's personal branch:
   ```
   git checkout -b {slug}
   git push -u origin {slug}
   git checkout main
   ```

8. Confirm to Pat:
   - Playground URL: `https://sm-native-5c5b643660da.herokuapp.com/`
   - Designer's branch: `{slug}`
   - Files in `src/designers/{slug}/{proto-slug}/`
