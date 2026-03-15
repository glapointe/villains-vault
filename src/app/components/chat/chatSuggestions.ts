/**
 * Chat Suggestions
 *
 * Centralised store of predefined prompt suggestions shown to users
 * in the chat empty state and the ChatPromptBar dropdown.
 * Each suggestion has a visible `prompt` and optional hidden `instructions`
 * that guide the agent without being shown to the user.
 *
 * Suggestions are grouped by context so the UI can pick the right set
 * based on the page the user is on and whether they are authenticated.
 */

/** A predefined suggestion with an optional hidden instruction for the agent. */
export interface Suggestion {
	/** The prompt text displayed to the user. */
	prompt: string;
	/** Hidden supplemental instructions sent to the agent (not shown to the user). */
	instructions?: string;
}

/**
 * The context key used to select a suggestion set.
 * - `general` — chat page / home page (no specific resource)
 * - `race`    — viewing a specific race
 * - `results` — viewing a specific runner result
 */
export type SuggestionContext = 'general' | 'race' | 'results';

// ---------------------------------------------------------------------------
// General suggestions (no auth required)
// ---------------------------------------------------------------------------

const GENERAL_SUGGESTIONS: Suggestion[] = [
	{
		prompt: 'Who had the most kills in the last race?',
		instructions:
			'Use get_available_years once to get the list of years then list_events to find the most recent race. Use query_race_results with sortBy "Passes" descending to find the runner with the most kills. Then call get_result_details on the top result to provide full details and provide a link to the results. Include the kill chart in the results.',
	},
	{
		prompt: 'How has the runner counts changed for each race type over the years?',
		instructions:
			'Use get_available_years once to get the list of years to find the full range, then call get_bulk_race_statistics with the full year range. Group results by distance (10K, 10mi, Half Marathon, Marathon) and present a table showing year, event name, total runners, and race URL for each distance. Highlight trends (growing/shrinking participation).',
	},
	{
		prompt: 'Show me the top 10 finishers in the last race',
		instructions:
			'Use get_available_years once to get the list of years then list_events to find the most recent race. Call query_race_results with limit=10. Then call get_result_details for the top 3 of each runner type to provide richer detail on the podium finishers and include a link to the results.',
	},
	{
		prompt: 'Who were the top finishers from NH in the last race?',
		instructions:
			'Use get_available_years once to get the list of years then list_events to find the most recent race. Call query_race_results with region="NH". Present results in a table including placement, net time, pace, and race URL.',
	},
];

// ---------------------------------------------------------------------------
// Authenticated general suggestions (user is signed in, no page context)
// ---------------------------------------------------------------------------

const AUTHENTICATED_GENERAL_SUGGESTIONS: Suggestion[] = [
	{
		prompt: 'List all my races and results',
		instructions:
			"Use the user's name from context with search_runner_by_name to find their results. Then call find_runner_across_races on one result to discover all their races. Present a chronological table showing event, race, placement, time, pace, and race URL for each result.",
	},
	{
		prompt: 'How did I do in my last race?',
		instructions:
			"Find the user's most recent result using search_runner_by_name, then get_result_details for full stats including kills/assassins and percentiles. Also call get_runner_split_analysis for pacing breakdown. Provide a thorough performance summary and include a link to the race results. Include the kill chart in the results.",
	},
	{
		prompt: "Compare my results from this year's races to the same races from last year",
		instructions:
			'Use search_runner_by_name and find_runner_across_races to gather all results. Group by race distance/type and compare year-over-year. Show improvements or regressions in placement, time, pace, and kills. Present as a comparison table and include links to the race results.',
	},
	{
		prompt: "What's my average pace for 10Ks?",
		instructions:
			'Use search_runner_by_name and find_runner_across_races to find all 10K results. Calculate average pace across all 10K races. Show each individual 10K race with pace and the overall average. Note any trend (improving/declining).',
	},
];

// ---------------------------------------------------------------------------
// Race-page suggestions (viewing a specific race)
// ---------------------------------------------------------------------------

const RACE_SUGGESTIONS: Suggestion[] = [
	{
		prompt: 'Who had the most kills for this race?',
		instructions:
			'The race ID is available in context. Use query_race_results with sortBy "Passes" descending to find the runner with the most kills. Then call get_result_details on the top result to provide full details. Include the kill chart in the results.',
	},
	{
		prompt: 'How has the runner counts changed for this race over the years?',
		instructions:
			'The race ID is available in context. Use get_available_years once to get the list of years to find the full range, then call get_bulk_race_statistics with the full year range. Only list results for this race distance and event (use the event name to match similar events) and present a table showing year, event name, total runners, total male, total female, and race URL for each event. Highlight trends (growing/shrinking participation) and include a line chart with series for total, male, and female.',
	},
	{
		prompt: 'Who are the winners of this race over the years?',
		instructions:
			'The race ID is available in context. Use get_available_years once to get the list of years to find the full range, then call get_bulk_race_statistics with the full year range. Only list results for this race distance and event (use the event name to match similar events) and present a table male and female winners (runner, hand cycle, push rim, duo), their net time, pace, and race URL for each event.',
	},
];

const AUTHENTICATED_RACE_SUGGESTIONS: Suggestion[] = [
	{
		prompt: 'How did I do in this race?',
		instructions:
			"The race ID is available in context. Use the user's name from context with search_results scoped to this race. Then call get_result_details and get_runner_split_analysis for a full performance breakdown. Include the kill chart in the results.",
	},
	{
		prompt: 'Compare my results from this race to other races for this event.',
		instructions:
			"The race ID is available in context. Find the user's result using search_results, then call find_runner_across_races to get all race details and filter the results to just the events that match this event distance and event name.",
	},
	...RACE_SUGGESTIONS,
];

// ---------------------------------------------------------------------------
// Results-page suggestions (viewing a specific runner result)
// ---------------------------------------------------------------------------

const RESULTS_SUGGESTIONS: Suggestion[] = [
	{
		prompt: "Show this runner's split analysis",
		instructions:
			'The result ID is available in context. Call get_runner_split_analysis to show per-segment pace, cumulative times, and whether the runner ran a negative split.',
	},
	{
		prompt: 'Who finished closest to this runner?',
		instructions:
			'The result ID is available in context. Call get_closest_results to find runners who finished closest in time. Present a table with placement, name, time, and pace.',
	},
	{
		prompt: "Show this runner's other race results",
		instructions:
			'The result ID is available in context. Call find_runner_across_races to discover all of their races. Present a chronological table with event, race, placement, time, pace, and race URL.',
	},
];

const AUTHENTICATED_RESULTS_SUGGESTIONS: Suggestion[] = [
	{
		prompt: 'Compare my result to this runner',
		instructions:
			"The result ID and race ID are available in context. Find the user's result using search_results with search_runner_by_name, then call compare_runners with both result IDs for a head-to-head comparison.",
	},
	{
		prompt: 'Compare my results from this race to other races for this event.',
		instructions:
			"The result ID and race ID are available in context. Call find_runner_across_races to get all race details and filter the results to just the events that match this event distance and event name.",
	},
	...RESULTS_SUGGESTIONS,
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the list of suggestions appropriate for the given context and auth state.
 *
 * @param suggestionContext - Which page family the user is on.
 * @param isAuthenticated  - Whether the user is signed in.
 */
export function getSuggestions(
	suggestionContext: SuggestionContext = 'general',
	isAuthenticated = false,
): Suggestion[] {
	switch (suggestionContext) {
		case 'race':
			return isAuthenticated ? AUTHENTICATED_RACE_SUGGESTIONS : RACE_SUGGESTIONS;
		case 'results':
			return isAuthenticated ? AUTHENTICATED_RESULTS_SUGGESTIONS : RESULTS_SUGGESTIONS;
		case 'general':
		default:
			return isAuthenticated ? AUTHENTICATED_GENERAL_SUGGESTIONS : GENERAL_SUGGESTIONS;
	}
}

/**
 * Derive a `SuggestionContext` from a `ChatContext` object.
 * Falls back to `'general'` when no specific page is identified.
 */
export function inferSuggestionContext(context?: { pageName?: string }): SuggestionContext {
	switch (context?.pageName) {
		case 'race':
			return 'race';
		case 'results':
			return 'results';
		default:
			return 'general';
	}
}
