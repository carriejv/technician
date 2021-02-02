/** Error type thrown by require() if a key has no value. */
export class ConfigNotFoundError extends Error {
    /**
     * Error type thrown by require() if a key has no value.
     * @param message The error message.
     */
    constructor(message?: string) {
        super(message);
        this.name = 'ConfigNotFoundError';
    }
}
