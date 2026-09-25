import axiosInstance from '../utils/axios';

export interface ManagerChatBody {
  message: string;
  session_id: string;
  store_id?: string;
}

export function postManagerChat(body: ManagerChatBody) {
  return axiosInstance.post('/agent/manager/chat', body).then((response) => response.data);
}

export function resolveManagerProposal(proposalId: string, status: 'APPROVED' | 'REJECTED') {
  return axiosInstance
    .post(`/agent/proposals/${encodeURIComponent(proposalId)}/resolve`, { status })
    .then((response) => response.data);
}

export function collectProposalIds(payload: unknown): string[] {
  const ids = new Set<string>();
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if ((key === 'proposal_id' || key === 'proposalId') && typeof value === 'string' && value.trim()) {
        ids.add(value.trim());
      } else {
        walk(value);
      }
    }
  };
  walk(payload);
  return [...ids];
}
