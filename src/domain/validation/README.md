# Validation (`src/domain/validation/`)

This directory contains the core validation logic for the application. It is used to ensure data integrity both at the UI level (form validation) and the persistence level (pre-save checks).

The validation logic is strictly separated from the UI and infrastructure, residing in the domain layer to ensure consistency across the application.

## Key Components

- `rules.ts`: Contains atomic, reusable validation rules (e.g., `isRequired`, `isEmail`, `isIBAN`, `isPositiveNumber`).
- `validators.ts`: Combines atomic rules into higher-level validators for domain entities like Accounts, Bookings, and Stocks.
- `messages.ts`: Handles the mapping of validation error codes to human-readable (and localizable) messages.
- `duplicates.ts`: Specialized logic for detecting duplicate entries in the database.

## Usage

Validators typically return a boolean or an object containing error details, which can then be used by the UI to display feedback or by repositories to block invalid data.

## Directory Structure

### Files

- `duplicates.ts`: isDuplicateAccountIban, isDuplicateBookingTypeName
- `messages.ts`: createIbanMessages, createSwiftMessages
- `rules.ts`: required, validateIBAN, validateISIN, validateSWIFT
- `validators.ts`: normalizeBookingTypeName, validateAccount, validateBooking, validateBookingType, validateStock

