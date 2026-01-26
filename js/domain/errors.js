export class AppError extends Error {
    _code;
    _category;
    _context;
    _recoverable;
    constructor(message, _code, _category, _context, _recoverable = true) {
        super(message);
        this._code = _code;
        this._category = _category;
        this._context = _context;
        this._recoverable = _recoverable;
        this.name = 'AppError';
    }
}
