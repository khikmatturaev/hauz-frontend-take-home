# Implementation Notes

## Architecture decisions

- Authentication is handled through Appwrite Email OTP using TanStack Start server functions.
- The Appwrite API key is server-only and is never exposed to browser code.
- The authenticated Appwrite session secret is stored in an HttpOnly cookie.
- Personal Account data is accessed through the deployed Appwrite Function rather than directly from the frontend.
- The existing Appwrite Function and unique appwrite_user_id index are used to protect Personal Account creation from duplicate requests.
- Profile edits use the authenticated Appwrite execution identity on the server.
- Optional contactEmail and bio values are sent as null when cleared so the stored values are actually removed.
- The role is immutable after Personal Account creation.

## Requirement decisions

The brief says the profile form should send the signed-in user ID together with profile changes. I intentionally did not trust or forward a client-supplied user ID for authorization. The server derives the authenticated identity from the Appwrite session/execution context instead. This prevents a client from attempting to update another user's Personal Account by changing an ID in the browser.

## Production next steps

- Add automated unit/integration tests for authentication, onboarding, profile updates and redirect handling.
- Add rate limiting and abuse monitoring around Email OTP requests.
- Add structured server-side logging and error monitoring.
- Review session expiration, cookie rotation and CSRF protections before production launch.
- Add end-to-end coverage for hard refreshes, expired sessions and concurrent onboarding requests.
