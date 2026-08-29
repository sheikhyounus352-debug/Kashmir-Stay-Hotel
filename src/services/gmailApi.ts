import { getAccessToken } from './gmailAuth';

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  isUnread: boolean;
  hasAttachment?: boolean;
}

export interface GmailMessageDetail extends GmailMessageSummary {
  bodyText: string;
  bodyHtml?: string;
  labels: string[];
}

export interface GmailUserProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

/**
 * Base64 URL safe encoder
 */
function base64UrlEncode(str: string): string {
  // Use UTF-8 encoding support
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decode Base64 URL safe string
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return atob(base64);
  }
}

/**
 * Get Gmail User Profile
 */
export async function getGmailProfile(): Promise<GmailUserProfile> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google. Please sign in to access Gmail.');
  }

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch profile: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * List messages with optional search query
 */
export async function listGmailMessages(options?: {
  query?: string;
  maxResults?: number;
  pageToken?: string;
  labelIds?: string[];
}): Promise<{ messages: GmailMessageSummary[]; nextPageToken?: string; resultSizeEstimate: number }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google. Please sign in to access Gmail.');
  }

  const params = new URLSearchParams();
  if (options?.query) params.append('q', options.query);
  if (options?.maxResults) params.append('maxResults', options.maxResults.toString());
  if (options?.pageToken) params.append('pageToken', options.pageToken);
  if (options?.labelIds && options.labelIds.length > 0) {
    options.labelIds.forEach(id => params.append('labelIds', id));
  }

  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to list messages: ${response.statusText}`);
  }

  const data = await response.json();
  const rawList: { id: string; threadId: string }[] = data.messages || [];

  // Fetch metadata details for the messages in parallel (capped at 15 for responsiveness)
  const summaries: GmailMessageSummary[] = await Promise.all(
    rawList.slice(0, 15).map(async (msg) => {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!msgRes.ok) throw new Error('Failed to load message');
        const detail = await msgRes.json();
        
        const headers: GmailHeader[] = detail.payload?.headers || [];
        const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        return {
          id: detail.id,
          threadId: detail.threadId,
          snippet: detail.snippet || '',
          subject: getHeader('Subject') || '(No Subject)',
          from: getHeader('From') || 'Unknown Sender',
          to: getHeader('To') || '',
          date: getHeader('Date') || '',
          isUnread: detail.labelIds?.includes('UNREAD') ?? false,
        };
      } catch (err) {
        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: '',
          subject: '(Message unavailable)',
          from: '',
          to: '',
          date: '',
          isUnread: false,
        };
      }
    })
  );

  return {
    messages: summaries,
    nextPageToken: data.nextPageToken,
    resultSizeEstimate: data.resultSizeEstimate || summaries.length,
  };
}

/**
 * Fetch full message body and details
 */
export async function getGmailMessageDetail(messageId: string): Promise<GmailMessageDetail> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google. Please sign in to access Gmail.');
  }

  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch message: ${response.statusText}`);
  }

  const data = await response.json();
  const headers: GmailHeader[] = data.payload?.headers || [];
  const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  // Extract text and HTML body recursively
  let bodyText = '';
  let bodyHtml = '';

  const extractBody = (part: any) => {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText += base64UrlDecode(part.body.data);
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml += base64UrlDecode(part.body.data);
    }

    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(extractBody);
    }
  };

  if (data.payload) {
    extractBody(data.payload);
  }

  if (!bodyText && data.snippet) {
    bodyText = data.snippet;
  }

  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet || '',
    subject: getHeader('Subject') || '(No Subject)',
    from: getHeader('From') || 'Unknown Sender',
    to: getHeader('To') || '',
    date: getHeader('Date') || '',
    isUnread: data.labelIds?.includes('UNREAD') ?? false,
    labels: data.labelIds || [],
    bodyText: bodyText.trim(),
    bodyHtml: bodyHtml.trim() || undefined,
  };
}

/**
 * Send an email via Gmail API
 * Note: Must be called only after user confirmation!
 */
export async function sendGmailEmail(options: {
  to: string;
  subject: string;
  bodyText: string;
  cc?: string;
  replyToMessageId?: string;
  threadId?: string;
}): Promise<{ id: string; threadId: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google. Please sign in to send emails.');
  }

  const { to, subject, bodyText, cc, threadId } = options;

  // Construct RFC 2822 email message
  const lines: string[] = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
  ];

  if (cc) {
    lines.push(`Cc: ${cc}`);
  }

  lines.push('', bodyText);
  const rawMessage = lines.join('\r\n');
  const encodedEmail = base64UrlEncode(rawMessage);

  const payload: any = { raw: encodedEmail };
  if (threadId) {
    payload.threadId = threadId;
  }

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send email: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Trash an email (move to trash)
 * Note: Must be called only after user confirmation!
 */
export async function trashGmailMessage(messageId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google. Please sign in.');
  }

  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete message: ${response.statusText}`);
  }
}
