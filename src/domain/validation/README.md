# Validation (`src/domain/validation/`)

This directory contains the core validation logic for the application. It is used to ensure data integrity both at the
UI level (form validation) and the persistence level (pre-save checks).

The validation logic is strictly separated from the UI and infrastructure, residing in the domain layer to ensure
consistency across the application.

## Key Components

- `rules.ts`: Contains atomic, reusable validation rules (`validateIBAN`, `validateISIN`, `validateSWIFT`), each
  returning a `DomainValidationResult` with a `VALIDATION_CODES` error the UI layer maps to a translated message.
  Note there is deliberately **no** `required` here: the presence check belongs to the form layer and lives in
  `adapters/ui/validationAdapter.ts`, which is what every form binds. A second function of that name at this level
  was removed as unused — it had no `src/` consumer, and it disagreed with the adapter's on whitespace.
- `validators.ts`: Combines atomic rules into higher-level validators for domain entities like Accounts, Bookings, and
  Stocks.
- `messages.ts`: Factory functions producing localized IBAN/SWIFT validation rule messages.
- `duplicates.ts`: Specialized logic for detecting duplicate entries in the database.
- `referentialIntegrity.ts`: Cross-entity foreign-key survey — reports the **ids** of bookings, stocks, and
  booking types pointing at a non-existent account, booking type, or stock. Ids rather than counts because its
  consumers differ: import lists the offending records, while export and the database health check only need
  `.length`. `cStockID` is checked only when truthy — `0` is the "no stock" sentinel every non-depot booking
  carries, not a dangling reference.

## Usage

Validators typically return a boolean or an object containing error details, which can then be used by the UI to display
feedback or by repositories to block invalid data.

## Directory Structure

### Files

- `duplicates.ts`: isDuplicateAccountIban, isDuplicateStockIsin, isDuplicateStockSymbol,
  isDuplicateBookingTypeName
- `messages.ts`: createIbanMessages, createSwiftMessages
- `referentialIntegrity.ts`: findReferentialIssues, hasReferentialIssues, describeReferentialIssues
- `rules.ts`: validateIBAN, validateISIN, validateSWIFT
- `validators.ts`: resolveLegacyBookingTypeRole, normalizeBookingTypeName, validateAccount, validateBooking,
  validateBookingType, validateStock

