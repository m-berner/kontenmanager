export var ValidationError;
(function (ValidationError) {
    ValidationError["REQUIRED"] = "REQUIRED";
    ValidationError["INVALID_FORMAT"] = "INVALID_FORMAT";
    ValidationError["INVALID_LENGTH"] = "INVALID_LENGTH";
    ValidationError["INVALID_CHECKSUM"] = "INVALID_CHECKSUM";
    ValidationError["DUPLICATE"] = "DUPLICATE";
    ValidationError["NEGATIVE_VALUE"] = "NEGATIVE_VALUE";
    ValidationError["ONE_OF_TWO_REQUIRED"] = "ONE_OF_TWO_REQUIRED";
    ValidationError["INVALID_COUNTRY"] = "INVALID_COUNTRY";
    ValidationError["INVALID_BANK"] = "INVALID_BANK";
    ValidationError["INVALID_REGION"] = "INVALID_REGION";
    ValidationError["INVALID_BRANCH"] = "INVALID_BRANCH";
    ValidationError["TEST_BIC"] = "TEST_BIC";
    ValidationError["MAX_LENGTH"] = "MAX_LENGTH";
    ValidationError["MUST_BEGIN_WITH_LETTER"] = "MUST_BEGIN_WITH_LETTER";
})(ValidationError || (ValidationError = {}));
