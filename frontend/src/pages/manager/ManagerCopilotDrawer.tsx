import React, { useRef, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { t } from './manager-tokens';
import {
  collectProposalIds,
  postManagerChat,
  resolveManagerProposal,
} from '../../services/managerCopilotClient';

interface ChatTurn {
  role: 'user' | 'copilot';
  text: string;
  proposalIds: string[];
}

function errorText(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: { detail?: string } } }).response;
    if (response?.status === 503) {
      return 'Copilot is unavailable.';
    }
    if (typeof response?.data?.detail === 'string' && response.data.detail) {
      return response.data.detail;
    }
  }
  return 'Copilot request failed.';
}

export function ManagerCopilotDrawer({ storeId }: { storeId?: string }) {
  const currentUser = useAppSelector(selectCurrentUser);
  const role = currentUser?.type;
  const allowed = role === 'MANAGER' || role === 'ASSISTANT_MANAGER';
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const sessionId = useRef(
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `mgr-${Date.now()}`,
  );

  if (!allowed) {
    return null;
  }

  const send = async () => {
    const message = draft.trim();
    if (!message || pending) {
      return;
    }
    setPending(true);
    setError('');
    setDraft('');
    setTurns((prev) => [...prev, { role: 'user', text: message, proposalIds: [] }]);
    try {
      const data = await postManagerChat({
        message,
        session_id: sessionId.current,
        store_id: storeId || undefined,
      });
      const reply = typeof data?.reply === 'string' ? data.reply : JSON.stringify(data);
      setTurns((prev) => [
        ...prev,
        { role: 'copilot', text: reply, proposalIds: collectProposalIds(data) },
      ]);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  };

  const resolve = async (proposalId: string, status: 'APPROVED' | 'REJECTED') => {
    setError('');
    try {
      await resolveManagerProposal(proposalId, status);
      setTurns((prev) =>
        prev.map((turn) => ({
          ...turn,
          proposalIds: turn.proposalIds.filter((id) => id !== proposalId),
        })),
      );
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <>
      <button
        type="button"
        data-testid="manager-copilot-toggle"
        onClick={() => setOpen(true)}
        style={{
          height: 38,
          padding: '0 12px',
          borderRadius: 10,
          border: '1px solid rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.5)',
          color: t.black,
          fontFamily: t.font,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Copilot
      </button>
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            maxWidth: '100%',
            fontFamily: t.font,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottom: `1px solid ${t.grayLight}` }}>
          <strong style={{ fontSize: 16, color: t.black }}>Copilot</strong>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close copilot" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: t.font }}>
            Close
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {turns.length === 0 && (
            <p style={{ margin: 0, color: t.gray, fontSize: 14 }}>Ask about stock, forecasts, or staffing.</p>
          )}
          {turns.map((turn, index) => (
            <div key={`${turn.role}-${index}`}>
              <div style={{ fontSize: 12, color: t.gray, marginBottom: 4 }}>{turn.role === 'user' ? 'You' : 'Copilot'}</div>
              <div style={{ fontSize: 14, color: t.black, whiteSpace: 'pre-wrap' }}>{turn.text}</div>
              {turn.proposalIds.map((id) => (
                <div key={id} style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <button type="button" aria-label={`Approve ${id}`} onClick={() => resolve(id, 'APPROVED')} style={{ background: t.orange, color: t.white, border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontFamily: t.font }}>
                    Approve
                  </button>
                  <button type="button" aria-label={`Reject ${id}`} onClick={() => resolve(id, 'REJECTED')} style={{ background: t.white, color: t.black, border: `1px solid ${t.grayLight}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontFamily: t.font }}>
                    Reject
                  </button>
                </div>
              ))}
            </div>
          ))}
          {error && (
            <p role="alert" style={{ margin: 0, color: t.red, fontSize: 14 }}>{error}</p>
          )}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
          style={{ display: 'flex', gap: 8, padding: 16, borderTop: `1px solid ${t.grayLight}` }}
        >
          <label htmlFor="manager-copilot-message" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            Message
          </label>
          <input
            id="manager-copilot-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            style={{ flex: 1, minWidth: 0, padding: '10px 12px', border: `1px solid ${t.grayLight}`, borderRadius: 8, fontFamily: t.font, fontSize: 14 }}
          />
          <button type="submit" disabled={pending} style={{ background: t.orange, color: t.white, border: 'none', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontFamily: t.font, fontWeight: 600 }}>
            Send
          </button>
        </form>
      </Drawer>
    </>
  );
}
