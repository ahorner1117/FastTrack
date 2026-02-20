# Explore & Post Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add pull-to-refresh on Explore, fix keyboard covering text input on Create Post, add Google Places location to posts, and show toast notifications on post success/failure.

**Architecture:** Four independent features touching the explore screen, create post screen, post data model, and app root. The location feature requires a Supabase schema change, new dependency, and changes across the full post pipeline. Toast and keyboard-aware-scroll are lightweight library integrations.

**Tech Stack:** React Native, Expo, Zustand, Supabase, react-native-google-places-autocomplete, react-native-keyboard-aware-scroll-view, react-native-toast-message

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install the three new packages**

Run:
```bash
npm install react-native-toast-message react-native-keyboard-aware-scroll-view react-native-google-places-autocomplete
```

**Step 2: Verify installation**

Run: `npx tsc --noEmit`
Expected: No new type errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add toast-message, keyboard-aware-scroll-view, google-places-autocomplete"
```

---

### Task 2: Pull-to-Refresh on Explore

**Files:**
- Modify: `src/components/Profile/PostGrid.tsx:21-38` (add props)
- Modify: `src/components/Profile/PostGrid.tsx:94-118` (pass to FlatList)
- Modify: `app/(tabs)/explore.tsx:49-55` (destructure refreshExplore)
- Modify: `app/(tabs)/explore.tsx:282-288` (pass to PostGrid)

**Step 1: Add `onRefresh` and `refreshing` props to PostGrid**

In `src/components/Profile/PostGrid.tsx`, add to the `PostGridProps` interface:

```typescript
interface PostGridProps {
  posts: Post[];
  isDark: boolean;
  onPostPress: (post: Post) => void;
  isLoading?: boolean;
  onEndReached?: () => void;
  ListHeaderComponent?: React.ReactElement | null;
  scrollEnabled?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}
```

Destructure the new props in the function signature:

```typescript
export function PostGrid({
  posts,
  isDark,
  onPostPress,
  isLoading = false,
  onEndReached,
  ListHeaderComponent,
  scrollEnabled = true,
  onRefresh,
  refreshing = false,
}: PostGridProps) {
```

Pass them to the `FlatList`:

```tsx
<FlatList
  data={posts}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}
  numColumns={NUM_COLUMNS}
  ListHeaderComponent={ListHeaderComponent}
  ListEmptyComponent={renderEmpty}
  ListFooterComponent={renderFooter}
  onEndReached={onEndReached}
  onEndReachedThreshold={0.5}
  scrollEnabled={scrollEnabled}
  showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
  contentContainerStyle={posts.length === 0 && styles.emptyListContent}
  getItemLayout={ListHeaderComponent ? undefined : (_, index) => ({
    length: cellSize + GRID_GAP,
    offset: (cellSize + GRID_GAP) * Math.floor(index / NUM_COLUMNS),
    index,
  })}
  maxToRenderPerBatch={9}
  initialNumToRender={9}
  removeClippedSubviews={true}
  windowSize={5}
  onRefresh={onRefresh}
  refreshing={refreshing}
/>
```

**Step 2: Wire up in explore.tsx**

In `app/(tabs)/explore.tsx`, destructure `refreshExplore` and `isRefreshingExplore` from `useFeedStore`:

```typescript
const {
  explorePosts,
  isLoadingExplore,
  isRefreshingExplore,
  hasMoreExplore,
  fetchExplorePosts,
  loadMoreExplore,
  refreshExplore,
} = useFeedStore();
```

Pass to `PostGrid`:

```tsx
<PostGrid
  posts={explorePosts}
  isDark={isDark}
  onPostPress={handlePostPress}
  isLoading={isLoadingExplore}
  onEndReached={hasMoreExplore ? loadMoreExplore : undefined}
  onRefresh={refreshExplore}
  refreshing={isRefreshingExplore}
/>
```

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/Profile/PostGrid.tsx app/\(tabs\)/explore.tsx
git commit -m "feat: add pull-to-refresh on Explore page"
```

---

### Task 3: Fix Keyboard Covering Text Input on Create Post

**Files:**
- Modify: `app/posts/create.tsx:1-13` (imports)
- Modify: `app/posts/create.tsx:145-151` (replace KeyboardAvoidingView + ScrollView)

**Step 1: Update imports**

In `app/posts/create.tsx`, remove `ScrollView`, `KeyboardAvoidingView`, and `Platform` from the react-native import (if not used elsewhere). Add import for `KeyboardAwareScrollView`:

Replace:
```typescript
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
```

With:
```typescript
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
```

**Step 2: Replace KeyboardAvoidingView + ScrollView with KeyboardAwareScrollView**

Replace:
```tsx
<KeyboardAvoidingView
  style={styles.flex}
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
>
  <ScrollView
    style={styles.flex}
    contentContainerStyle={styles.scrollContent}
  >
    {/* ... all content ... */}
  </ScrollView>
</KeyboardAvoidingView>
```

With:
```tsx
<KeyboardAwareScrollView
  style={styles.flex}
  contentContainerStyle={styles.scrollContent}
  enableOnAndroid
  extraScrollHeight={20}
  keyboardShouldPersistTaps="handled"
>
  {/* ... all content unchanged ... */}
</KeyboardAwareScrollView>
```

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add app/posts/create.tsx
git commit -m "fix: keyboard no longer covers text input on create post"
```

---

### Task 4: Add Supabase Schema Column for Location

**This is a manual step.** Run the following SQL in the Supabase SQL editor (Dashboard > SQL Editor):

```sql
ALTER TABLE posts ADD COLUMN location_name text;
```

No migration file needed - this is a direct schema change via the Supabase dashboard.

**Verify:** Check the `posts` table in Supabase Table Editor and confirm `location_name` column exists as nullable text.

---

### Task 5: Add Google Places API Key

**Step 1: Get a Google Places API key**

1. Go to https://console.cloud.google.com/
2. Create or select a project
3. Enable the "Places API" (new) or "Places API (Legacy)"
4. Create an API key under Credentials
5. Optionally restrict the key to the Places API

**Step 2: Add to .env**

Add to `.env`:
```
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here
```

**Step 3: Commit**

Do NOT commit the `.env` file. Just ensure `.env` is in `.gitignore`.

---

### Task 6: Update Post Types

**Files:**
- Modify: `src/types/index.ts:244-262` (Post interface)
- Modify: `src/types/index.ts:273-281` (CreatePostInput interface)

**Step 1: Add `location_name` to the Post interface**

In `src/types/index.ts`, add `location_name` to the `Post` interface after `drive_id`:

```typescript
export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  vehicle_id: string | null;
  run_id: string | null;
  drive_id: string | null;
  location_name: string | null;
  visibility: PostVisibility;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  profile?: Profile;
  run?: { zero_to_sixty_time: number | null; vehicle_name: string | null } | null;
  is_liked?: boolean;
}
```

**Step 2: Add `location_name` to CreatePostInput**

```typescript
export interface CreatePostInput {
  image_url: string;
  thumbnail_url?: string;
  caption?: string;
  vehicle_id?: string;
  run_id?: string;
  drive_id?: string;
  location_name?: string;
  visibility?: PostVisibility;
}
```

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors (Supabase select `*` will include the new column automatically)

**Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add location_name to Post and CreatePostInput types"
```

---

### Task 7: Update postsService to Pass location_name

**Files:**
- Modify: `src/services/postsService.ts:134-145` (createPost insert)
- Modify: `src/services/postsService.ts:290-293` (getUserPosts select)

**Step 1: Include location_name in the insert**

In `src/services/postsService.ts`, update the `createPost` function's insert object:

```typescript
const { data, error } = await supabase
  .from('posts')
  .insert({
    user_id: user.id,
    image_url: input.image_url,
    thumbnail_url: input.thumbnail_url || null,
    caption: input.caption || null,
    vehicle_id: input.vehicle_id || null,
    run_id: input.run_id || null,
    drive_id: input.drive_id || null,
    location_name: input.location_name || null,
    visibility: input.visibility || 'public',
  })
```

**Step 2: Include location_name in getUserPosts select**

Update the `getUserPosts` select string to include `location_name`:

```typescript
const { data, error } = await supabase
  .from('posts')
  .select('id, image_url, thumbnail_url, likes_count, comments_count, visibility, created_at, updated_at, user_id, caption, vehicle_id, run_id, drive_id, location_name')
  .eq('user_id', userId)
```

Note: `getPosts` and `getPost` use `select('*', ...)` so they'll automatically include the new column.

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/services/postsService.ts
git commit -m "feat: pass location_name through post creation and user posts query"
```

---

### Task 8: Update feedStore to Accept location_name

**Files:**
- Modify: `src/stores/feedStore.ts:51-58` (createNewPost signature)
- Modify: `src/stores/feedStore.ts:224-231` (createNewPost implementation)
- Modify: `src/stores/feedStore.ts:245-255` (createPost call)

**Step 1: Update createNewPost signature in the interface**

```typescript
createNewPost: (
  localImageUri: string,
  caption?: string,
  vehicleId?: string,
  runId?: string,
  driveId?: string,
  visibility?: PostVisibility,
  locationName?: string
) => Promise<Post>;
```

**Step 2: Update the implementation**

```typescript
createNewPost: async (
  localImageUri: string,
  caption?: string,
  vehicleId?: string,
  runId?: string,
  driveId?: string,
  visibility?: PostVisibility,
  locationName?: string
) => {
```

**Step 3: Pass location_name to createPost call**

```typescript
const post = await createPost({
  image_url: url,
  thumbnail_url: thumbnailUrl || undefined,
  caption,
  vehicle_id: vehicleId,
  run_id: runId,
  drive_id: driveId,
  visibility,
  location_name: locationName,
});
```

**Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/stores/feedStore.ts
git commit -m "feat: pass location_name through feedStore createNewPost"
```

---

### Task 9: Add Toast to App Root

**Files:**
- Modify: `app/_layout.tsx:1-9` (imports)
- Modify: `app/_layout.tsx:160-277` (RootLayoutNav return)

**Step 1: Add Toast import**

Add to the imports in `app/_layout.tsx`:

```typescript
import Toast from 'react-native-toast-message';
```

**Step 2: Add Toast component after the Stack in RootLayoutNav**

Replace the return in `RootLayoutNav`:

```tsx
return (
  <ThemeProvider
    value={colorScheme === 'dark' ? FastTrackDarkTheme : FastTrackLightTheme}
  >
    <Stack>
      {/* ... all existing Stack.Screen entries unchanged ... */}
    </Stack>
    <Toast />
  </ThemeProvider>
);
```

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: add Toast component to app root for in-app notifications"
```

---

### Task 10: Update Create Post Screen - Location Picker + Toast + Keyboard

**Files:**
- Modify: `app/posts/create.tsx` (full rewrite of imports and additions)

This task modifies the create post screen to:
1. Use `KeyboardAwareScrollView` (already done in Task 3)
2. Add location picker with Google Places autocomplete
3. Show toast on success/failure
4. Pass `locationName` to `createNewPost`

**Step 1: Update imports**

Add these imports to `app/posts/create.tsx`:

```typescript
import { MapPin, X, ChevronDown } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
```

Note: `MapPin` is added to the existing lucide import. `ImagePlus` and `X` are already imported.

**Step 2: Add location state**

Add after the existing state declarations (around line 55):

```typescript
const [locationName, setLocationName] = useState<string | null>(null);
const [showLocationPicker, setShowLocationPicker] = useState(false);
const [locationQuery, setLocationQuery] = useState('');
const [locationResults, setLocationResults] = useState<Array<{ place_id: string; description: string }>>([]);
const [isSearchingLocation, setIsSearchingLocation] = useState(false);
```

**Step 3: Add Google Places search function**

Add after the state declarations:

```typescript
const searchPlaces = useCallback(async (query: string) => {
  if (query.length < 2) {
    setLocationResults([]);
    return;
  }
  setIsSearchingLocation(true);
  try {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${apiKey}`
    );
    const data = await response.json();
    if (data.predictions) {
      setLocationResults(
        data.predictions.map((p: any) => ({
          place_id: p.place_id,
          description: p.description,
        }))
      );
    }
  } catch (error) {
    console.error('Places search error:', error);
  } finally {
    setIsSearchingLocation(false);
  }
}, []);
```

**Step 4: Add debounced location search effect**

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    if (locationQuery) searchPlaces(locationQuery);
  }, 300);
  return () => clearTimeout(timer);
}, [locationQuery, searchPlaces]);
```

**Step 5: Update handleSubmit to pass locationName and show toast**

```typescript
const handleSubmit = async () => {
  if (!imageUri) {
    Alert.alert('Image Required', 'Please select an image for your post.');
    return;
  }

  setIsSubmitting(true);
  try {
    await createNewPost(
      imageUri,
      caption.trim() || undefined,
      selectedVehicle?.id,
      runId || undefined,
      driveId || undefined,
      visibility,
      locationName || undefined
    );
    router.back();
    Toast.show({
      type: 'success',
      text1: 'Post shared successfully',
      visibilityTime: 2000,
    });
  } catch (error: any) {
    Toast.show({
      type: 'error',
      text1: 'Failed to create post',
      text2: error.message || 'Something went wrong',
      visibilityTime: 3000,
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

**Step 6: Add Location Picker UI**

Add this JSX after the `VisibilityToggle` and before the Run/Drive Preview section (after line 206):

```tsx
{/* Location Picker */}
<Pressable
  style={[styles.locationButton, { backgroundColor: colors.surface }]}
  onPress={() => setShowLocationPicker(!showLocationPicker)}
>
  <MapPin color={locationName ? COLORS.accent : colors.textSecondary} size={20} />
  <Text
    style={[
      styles.locationButtonText,
      { color: locationName ? colors.text : colors.textSecondary },
    ]}
    numberOfLines={1}
  >
    {locationName || 'Add Location'}
  </Text>
  {locationName && (
    <Pressable
      onPress={() => {
        setLocationName(null);
        setShowLocationPicker(false);
        setLocationQuery('');
        setLocationResults([]);
      }}
      hitSlop={8}
    >
      <X color={colors.textSecondary} size={18} />
    </Pressable>
  )}
</Pressable>

{showLocationPicker && (
  <View style={[styles.locationPicker, { backgroundColor: colors.surface }]}>
    <View style={[styles.locationSearchContainer, { backgroundColor: colors.background }]}>
      <TextInput
        style={[styles.locationSearchInput, { color: colors.text }]}
        placeholder="Search for a city..."
        placeholderTextColor={colors.textSecondary}
        value={locationQuery}
        onChangeText={setLocationQuery}
        autoFocus
      />
    </View>
    {isSearchingLocation && (
      <ActivityIndicator size="small" color={COLORS.accent} style={{ marginVertical: 8 }} />
    )}
    {locationResults.map((result) => (
      <Pressable
        key={result.place_id}
        style={styles.locationOption}
        onPress={() => {
          setLocationName(result.description);
          setShowLocationPicker(false);
          setLocationQuery('');
          setLocationResults([]);
        }}
      >
        <MapPin color={colors.textSecondary} size={16} />
        <Text style={[styles.locationOptionText, { color: colors.text }]} numberOfLines={1}>
          {result.description}
        </Text>
      </Pressable>
    ))}
  </View>
)}
```

Note: Also add `TextInput` to the react-native import.

**Step 7: Add location styles**

Add these to the `StyleSheet.create` call:

```typescript
locationButton: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 14,
  borderRadius: 12,
  marginBottom: 16,
  gap: 10,
},
locationButtonText: {
  flex: 1,
  fontSize: 15,
},
locationPicker: {
  borderRadius: 12,
  marginBottom: 16,
  overflow: 'hidden',
},
locationSearchContainer: {
  padding: 10,
},
locationSearchInput: {
  fontSize: 15,
  padding: 10,
  borderRadius: 8,
},
locationOption: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 14,
  gap: 10,
  borderTopWidth: StyleSheet.hairlineWidth,
  borderTopColor: 'rgba(255,255,255,0.1)',
},
locationOptionText: {
  flex: 1,
  fontSize: 14,
},
```

**Step 8: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 9: Commit**

```bash
git add app/posts/create.tsx
git commit -m "feat: add location picker and toast notifications to create post"
```

---

### Task 11: Display Location in PostCard Header

**Files:**
- Modify: `src/components/Feed/PostCard.tsx:96-119` (header section)

**Step 1: Update the PostCard header to show location**

Replace the header section (the `<View>` after the avatar containing displayName and timestamp):

```tsx
<View style={styles.headerTextContainer}>
  <View style={styles.headerTopRow}>
    <Text style={[styles.displayName, { color: colors.text }]}>
      {displayName}
    </Text>
    <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
      {formatTimeAgo(post.created_at)}
    </Text>
  </View>
  {post.location_name && (
    <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
      {post.location_name}
    </Text>
  )}
</View>
```

**Step 2: Add/update styles**

Add to the StyleSheet:

```typescript
headerTextContainer: {
  flex: 1,
},
headerTopRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
locationText: {
  fontSize: 12,
  marginTop: 1,
},
```

Also update the existing `displayName` style to remove any margin that was pushing timestamp below, and ensure `timestamp` doesn't have `marginTop` if it was positioned below before. The timestamp is now in the same row as displayName but aligned right.

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/Feed/PostCard.tsx
git commit -m "feat: display location name in PostCard header"
```

---

### Task 12: Final Verification

**Step 1: Full type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Test on simulator**

Run: `npm run ios`

Manual test checklist:
- [ ] Pull down on Explore grid - should show refresh spinner and reload posts
- [ ] Create post - tap caption field, keyboard should push content up (not cover it)
- [ ] Create post - tap "Add Location", search for a city, select it, see it displayed
- [ ] Create post - submit, should see green toast "Post shared successfully"
- [ ] Create post - if error, should see red toast with error message
- [ ] View a post with location - location should appear under the display name in the header

**Step 3: Final commit if any fixes needed**
