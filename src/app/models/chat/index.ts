/**
 * Chat Models
 * Types for the AI chat feature.
 */

/** Context about what the user is currently viewing, sent with chat requests. */
export interface ChatContext {
	/** Race ID if the user is on a race page. */
	raceId?: number;
	/** Race result ID if the user is on a result page. */
	resultId?: number;
	/** Event ID if the user is viewing an event. */
	eventId?: number;
	/** Name of the page the user is currently on (e.g., "race", "result", "home"). */
	pageName?: string;
	/** Runner name shown on the current page, if applicable. */
	runnerName?: string;
	/**
	 * Hidden supplemental instructions for the agent.
	 * Used by predefined prompts to refine agent behavior
	 * without showing implementation details to the user.
	 */
	supplementalInstructions?: string;
}

/** A single tool-call step performed by the agent (used in both streaming and non-streaming). */
export interface ChatStep {
	/** The step type. */
	type: 'thinking' | 'tool_result' | 'error';
	/** Name of the tool being called. */
	toolName?: string;
	/** Tool call ID for correlating thinking/result pairs. */
	toolCallId?: string;
	/** Arguments passed to the tool. */
	arguments?: string;
	/** Result returned by the tool. */
	result?: string;
	/** Whether the step is still in progress. */
	status: 'in_progress' | 'complete' | 'cancelled';
}

/** A single message in the chat conversation. */
export interface ChatMessage {
	/** Unique message ID. */
	id: string;
	/** Who sent it. */
	role: 'user' | 'assistant' | 'system';
	/** The text content (markdown for assistant messages). */
	content: string;
	/** Tool-call steps (only present on assistant messages). */
	steps?: ChatStep[];
	/** Whether this message is still being streamed. */
	isStreaming?: boolean;
}

/** A single SSE event from the streaming endpoint. */
export interface ChatStreamEvent {
	/** Event type. */
	type: 'thinking' | 'tool_result' | 'message_delta' | 'message_complete' | 'error';
	/** Tool name (for thinking/tool_result events). */
	toolName?: string;
	/** Tool call ID for correlating thinking/result pairs. */
	toolCallId?: string;
	/** Tool arguments (for thinking events). */
	arguments?: string;
	/** Text content (for message_delta) or error message. */
	content?: string;
	/** Tool result (for tool_result events). */
	result?: string;
}

/** Non-streaming response shape (mobile fallback). */
export interface ChatResponse {
	steps: ChatStep[];
	message: string;
}

/** Response from /chat/status. */
export interface ChatStatus {
	enabled: boolean;
	requiresAuth: boolean;
}

/** State of a pending chat action stored before auth redirect. */
export interface PendingChatAction {
	/** The prompt the user typed. */
	prompt: string;
	/** Page context at time of prompt. */
	context?: ChatContext;
	/** Where to navigate back to after login. */
	returnTo: string;
	/** Timestamp for expiry check. */
	timestamp: number;
}
