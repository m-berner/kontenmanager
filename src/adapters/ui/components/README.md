# Components Layer

This directory contains the user interface components of the application, built with **Vue 3** and **Vuetify 3**. The
components are organized to separate reusable UI elements from complex, stateful dialogs and forms.

## Role and Responsibilities

The mission of the components layer is to:

- **User Interaction**: Provide the visual interface for all user actions.
- **State Presentation**: Render reactive state from Pinia stores.
- **Form Handling**: Implement data entry interfaces using Vuetify components, integrated with `useForms` and
  `validationAdapter` / `src/domain/validation/*`.
- **Modality Management**: Handle complex user flows via the centralized `DialogPort` system.

## Directory Structure

### Directories

- `dialogs/`

### Files

- `AlertOverlay.vue`
- `CheckboxGrid.vue`
- `ContentCard.vue`
- `CreditDebitFieldset.vue`
- `CurrencyInput.vue`
- `DialogPort.vue`
- `DotMenu.vue`
- `DynamicList.vue`
- `MenuItem.vue`
- `ServiceSelector.vue`
- `ThemeSelector.vue`

