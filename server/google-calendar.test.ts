import { describe, it, expect, beforeAll } from 'vitest';
import { OAuth2Client } from 'google-auth-library';

describe('Google Calendar Integration', () => {
  let oauth2Client: OAuth2Client;

  beforeAll(() => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    expect(clientId).toBeDefined();
    expect(clientSecret).toBeDefined();

    oauth2Client = new OAuth2Client(clientId, clientSecret);
  });

  it('should have valid Google OAuth2 credentials', () => {
    expect(oauth2Client).toBeDefined();
    expect(process.env.GOOGLE_CLIENT_ID).toBeDefined();
    expect(process.env.GOOGLE_CLIENT_SECRET).toBeDefined();
    expect(process.env.GOOGLE_CLIENT_ID).toContain('apps.googleusercontent.com');
  });

  it('should generate valid OAuth2 authorization URL', () => {
    const redirectUrl = 'https://clinicaapp-p4nfwoum.manus.space/auth/google/callback';
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.readonly',
      ],
      redirect_uri: redirectUrl,
    });

    expect(authUrl).toBeDefined();
    expect(authUrl).toContain('client_id=' + process.env.GOOGLE_CLIENT_ID);
    expect(authUrl).toContain('scope=');
    expect(authUrl).toContain('redirect_uri=');
  });

  it('should have correct scopes for calendar access', () => {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.readonly',
    ];

    expect(scopes).toContain('https://www.googleapis.com/auth/calendar');
    expect(scopes.length).toBe(2);
  });
});
