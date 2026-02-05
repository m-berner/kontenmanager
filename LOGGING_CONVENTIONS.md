# Logging Conventions

## Overview
This project uses two distinct logging mechanisms with specific purposes:

### 1. DomainUtils.log() - Technical Logging
**Purpose**: Development and debugging
**Target**: Developers
**Output**: Console only

**Usage**:
```ts
import { DomainUtils } from "@/domains/utils";

// Component/service initialization
DomainUtils.log("--- components/MyComponent.vue setup ---");

// Lifecycle hooks
DomainUtils.log("MY_COMPONENT: onBeforeMount");
DomainUtils.log("MY_COMPONENT: onMounted");

// Method calls
DomainUtils.log("MY_COMPONENT: handleClick", data);

// Errors (use third parameter for log level)
DomainUtils.log("MY_COMPONENT: Error occurred", error, "error");
DomainUtils.log("MY_COMPONENT: Warning", warning, "warn");
DomainUtils.log("MY_COMPONENT: Info message", info, "info");
```

### 2. handleUserInfo() - User Notifications
**Purpose**: User-facing feedback
**Target**: End users
**Output**: Browser notifications or in-app alerts

**Modes**:

#### Notice Mode - Browser Notifications
```ts
import { useUserInfo } from "@/composables/useUserInfo";

const { handleUserInfo } = useUserInfo();

// Success notification
await handleUserInfo("notice", "AddBooking", "success", {
  noticeLines: [t("components.dialogs.addBooking.messages.success")]
});

// Error notification
await handleUserInfo("notice", "DeleteAccount", "error", {
  noticeLines: [t("errors.deleteFailed")]
});
```

#### Alert Mode - In-App Overlays
```ts
// Info alert
await handleUserInfo("alert", "Information", "Your data has been saved", {
  alertKind: "info",
  duration: 3000
});

// Error alert
await handleUserInfo("alert", "Error", error.message, {
  alertKind: "error"
});

// Confirmation dialog
const confirmed = await handleUserInfo("alert", "Confirm", "Delete this item?", {
  alertKind: "confirm"
});
```

## Migration Rules

### ❌ DEPRECATED - Do NOT Use
```ts
// WRONG - handleUserInfo("console") is deprecated
handleUserInfo("console", "MyComponent", "--- vue setup ---", {
  logLevel: "log"
});

// WRONG - handleUserInfo for technical logging
handleUserInfo("console", "MyComponent", "onBeforeMount", {
  logLevel: "log"
});
```

### ✅ CORRECT Usage
```ts
// RIGHT - Use DomainUtils.log for technical logging
DomainUtils.log("--- components/MyComponent.vue setup ---");
DomainUtils.log("MY_COMPONENT: onBeforeMount");

// RIGHT - Use handleUserInfo for user notifications only
await handleUserInfo("notice", "MyComponent", "success", {
  noticeLines: ["Operation completed successfully"]
});
```

## Component Naming Conventions

### Setup Logging
```ts
// Views
DomainUtils.log("--- views/HomeContent.vue setup ---");

// Components
DomainUtils.log("--- components/ThemeSelector.vue setup ---");

// Dialogs
DomainUtils.log("--- components/dialogs/AddBooking.vue setup ---");

// Forms
DomainUtils.log("--- components/dialogs/forms/BookingForm.vue setup ---");

// Services
DomainUtils.log("--- services/database.ts setup ---");

// Stores
DomainUtils.log("--- stores/settings.ts setup ---");

// Composables
DomainUtils.log("--- composables/useStorage.ts setup ---");
```

### Method Logging
Use SCREAMING_SNAKE_CASE for component names in method logs:
```ts
DomainUtils.log("ADD_BOOKING: onClickOk");
DomainUtils.log("THEME_SELECTOR: setSkin");
DomainUtils.log("BOOKING_FORM: updateValidation");
```

## Examples

### Vue Component
```ts
<script lang="ts" setup>
import { onBeforeMount } from "vue";
import { DomainUtils } from "@/domains/utils";
import { useUserInfo } from "@/composables/useUserInfo";

const { handleUserInfo } = useUserInfo();

const loadData = async () => {
  DomainUtils.log("MY_COMPONENT: loadData");
  try {
    // ... load data
    await handleUserInfo("notice", "MyComponent", "success", {
      noticeLines: ["Data loaded successfully"]
    });
  } catch (err) {
    DomainUtils.log("MY_COMPONENT: loadData failed", err, "error");
    await handleUserInfo("notice", "MyComponent", "error", {
      noticeLines: ["Failed to load data"]
    });
  }
};

onBeforeMount(() => {
  DomainUtils.log("MY_COMPONENT: onBeforeMount");
  loadData();
});

DomainUtils.log("--- components/MyComponent.vue setup ---");
</script>
```

### Dialog Component
```ts
<script lang="ts" setup>
import { DomainUtils } from "@/domains/utils";
import { useDialogSubmit } from "@/composables/useDialogSubmit";

const { createAddHandler } = useDialogSubmit();

const onClickOk = createAddHandler({
  dialogRef: baseDialogRef,
  componentName: "AddBooking",
  i18nPrefix: "components.dialogs.addBooking",
  reset,
  operation: async () => {
    // Business logic - errors are handled by createAddHandler
    // which shows handleUserInfo notifications automatically
  }
});

onBeforeMount(() => {
  DomainUtils.log("ADD_BOOKING: onBeforeMount");
  reset();
});

DomainUtils.log("--- components/dialogs/AddBooking.vue setup ---");
</script>
```

## Summary

| Use Case | Tool | Example |
|----------|------|---------|
| Debug/dev logging | `DomainUtils.log()` | `DomainUtils.log("COMPONENT: method", data)` |
| User success message | `handleUserInfo("notice")` | `await handleUserInfo("notice", "Title", "msg", {noticeLines: ["Success"]})` |
| User error message | `handleUserInfo("notice")` | `await handleUserInfo("notice", "Title", "error", {noticeLines: ["Error"]})` |
| User confirmation | `handleUserInfo("alert")` | `await handleUserInfo("alert", "Title", "msg", {alertKind: "confirm"})` |
| User info alert | `handleUserInfo("alert")` | `await handleUserInfo("alert", "Title", "msg", {alertKind: "info"})` |
