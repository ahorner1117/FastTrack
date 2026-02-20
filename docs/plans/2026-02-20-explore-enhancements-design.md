# Explore & Post Enhancements Design

## Features

### 1. Pull-to-Refresh on Explore

The `feedStore` already has `refreshExplore()` and `isRefreshingExplore` state. The `PostGrid` component's `FlatList` just needs `onRefresh`/`refreshing` props exposed.

**Changes:**
- `src/components/Profile/PostGrid.tsx`: Add `onRefresh` and `refreshing` optional props, pass to `FlatList`
- `app/(tabs)/explore.tsx`: Wire `refreshExplore` and `isRefreshingExplore` to `PostGrid`

### 2. Keyboard Avoidance on Create Post

Replace `ScrollView` inside `KeyboardAvoidingView` with `KeyboardAwareScrollView` from `react-native-keyboard-aware-scroll-view`. This auto-scrolls to focused inputs and handles iOS keyboard properly.

**Changes:**
- Install `react-native-keyboard-aware-scroll-view`
- `app/posts/create.tsx`: Replace `KeyboardAvoidingView` + `ScrollView` with `KeyboardAwareScrollView`

### 3. Post Location (Google Places Autocomplete)

Add optional location to posts using Google Places API for autocomplete search.

**Schema:**
- Add `location_name` (text, nullable) column to Supabase `posts` table

**Data flow:**
- User taps "Add Location" on create post screen
- Google Places autocomplete modal appears
- Selected place name stored as `location_name` string
- Passed through `createNewPost` -> `createPost` -> Supabase insert
- Displayed in PostCard header under display name

**PostCard header layout:**
```
[Avatar] DisplayName        [timestamp]
         Location Name
```

**Changes:**
- Install `react-native-google-places-autocomplete`
- `src/types/index.ts`: Add `location_name` to `Post` and `CreatePostInput`
- `src/services/postsService.ts`: Include `location_name` in create/select queries
- `src/stores/feedStore.ts`: Pass `location_name` through `createNewPost`
- `app/posts/create.tsx`: Add location picker UI (MapPin button, autocomplete modal, selected location display)
- `src/components/Feed/PostCard.tsx`: Display `location_name` under display name in header

### 4. Post Success/Failure Toast

Install `react-native-toast-message` for non-blocking notifications.

**Changes:**
- Install `react-native-toast-message`
- `app/_layout.tsx`: Add `<Toast />` component at root
- `app/posts/create.tsx`: Show success toast on post creation, error toast on failure (replace `Alert.alert` for errors)
