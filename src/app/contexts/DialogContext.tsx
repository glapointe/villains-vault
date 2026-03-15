/**
 * DialogContext
 * 
 * Provides imperative dialog API for showing alerts and confirmations.
 * Allows calling dialogs asynchronously without defining JSX elements.
 * 
 * Usage:
 * ```
 * const { showAlert, showConfirm } = useDialog();
 * 
 * await showAlert({ title: "Success", message: "Operation completed" });
 * 
 * const confirmed = await showConfirm({ 
 *   title: "Delete?", 
 *   message: "Are you sure?" 
 * });
 * if (confirmed) { ... }
 * ```
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertDialog, ConfirmationDialog, WorkingDialog } from '../components/ui';

/**
 * Options for alert dialog
 */
export interface AlertOptions {
	/** Dialog title */
	title: string;
	/** Dialog message/description */
	message?: string;
	/** Custom content to render */
	children?: ReactNode;
	/** Submit button text (default: "OK") */
	submitText?: string;
}

/**
 * Options for confirmation dialog
 */
export interface ConfirmOptions {
	/** Dialog title */
	title: string;
	/** Dialog message/description */
	message?: string;
	/** Custom content to render */
	children?: ReactNode;
	/** Submit button text (default: "Confirm") */
	submitText?: string;
	/** Cancel button text (default: "Cancel") */
	cancelText?: string;
}

/**
 * Options for working dialog
 */
export interface WorkingOptions {
	/** Dialog title */
	title: string;
	/** Dialog message/description */
	message?: string;
}

/**
 * Dialog context type
 */
interface DialogContextType {
	/** Show an alert dialog (returns promise that resolves when dismissed) */
	showAlert: (options: AlertOptions) => Promise<void>;
	/** Show a confirmation dialog (returns promise with true/false) */
	showConfirm: (options: ConfirmOptions) => Promise<boolean>;
	/** Show a working/loading dialog (does not resolve - caller must call hideWorking) */
	showWorking: (options: WorkingOptions) => void;
	/** Hide the working dialog */
	hideWorking: () => void;
}

/**
 * Internal dialog state
 */
interface DialogState {
	type: 'alert' | 'confirm' | 'working' | null;
	options: AlertOptions | ConfirmOptions | WorkingOptions | null;
	resolve: ((value?: boolean | void) => void) | null;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

/**
 * Hook to access dialog methods
 */
export const useDialog = (): DialogContextType => {
	const context = useContext(DialogContext);
	if (!context) {
		throw new Error('useDialog must be used within a DialogProvider');
	}
	return context;
};

/**
 * DialogProvider Component
 * 
 * Wrap your app with this provider to enable imperative dialogs.
 * Should be placed high in the component tree (e.g., in root _layout.tsx).
 */
export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [dialogState, setDialogState] = useState<DialogState>({
		type: null,
		options: null,
		resolve: null,
	});

	/**
	 * Show an alert dialog
	 */
	const showAlert = useCallback((options: AlertOptions): Promise<void> => {
		return new Promise<void>((resolve) => {
			setDialogState({
				type: 'alert',
				options,
				resolve: () => {
					resolve();
				},
			});
		});
	}, []);

	/**
	 * Show a confirmation dialog
	 */
	const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
		return new Promise<boolean>((resolve) => {
			setDialogState({
				type: 'confirm',
				options,
				resolve: (value?: boolean | void) => {
					resolve(value as boolean);
				},
			});
		});
	}, []);

	/**
	 * Show a working dialog
	 */
	const showWorking = useCallback((options: WorkingOptions): void => {
		setDialogState({
			type: 'working',
			options,
			resolve: null,
		});
	}, []);

	/**
	 * Hide the working dialog
	 */
	const hideWorking = useCallback((): void => {
		setDialogState({ type: null, options: null, resolve: null });
	}, []);

	/**
	 * Handle alert dismiss
	 */
	const handleAlertDismiss = useCallback(() => {
		if (dialogState.resolve) {
			dialogState.resolve();
		}
		setDialogState({ type: null, options: null, resolve: null });
	}, [dialogState.resolve]);

	/**
	 * Handle confirm submit
	 */
	const handleConfirmSubmit = useCallback(() => {
		if (dialogState.resolve) {
			dialogState.resolve(true);
		}
		setDialogState({ type: null, options: null, resolve: null });
	}, [dialogState.resolve]);

	/**
	 * Handle confirm cancel
	 */
	const handleConfirmCancel = useCallback(() => {
		if (dialogState.resolve) {
			dialogState.resolve(false);
		}
		setDialogState({ type: null, options: null, resolve: null });
	}, [dialogState.resolve]);

	const contextValue: DialogContextType = {
		showAlert,
		showConfirm,
		showWorking,
		hideWorking,
	};

	return (
		<DialogContext.Provider value={contextValue}>
			{children}

			{/* Alert Dialog */}
			{dialogState.type === 'alert' && dialogState.options && (
				<AlertDialog
					isOpen={true}
					title={dialogState.options.title}
					message={dialogState.options.message}
					submitText={(dialogState.options as AlertOptions).submitText || 'OK'}
					onSubmit={handleAlertDismiss}
				>
					{(dialogState.options as AlertOptions).children}
				</AlertDialog>
			)}

			{/* Confirmation Dialog */}
			{dialogState.type === 'confirm' && dialogState.options && (
				<ConfirmationDialog
					isOpen={true}
					title={dialogState.options.title}
					message={(dialogState.options as ConfirmOptions).message}
					submitText={(dialogState.options as ConfirmOptions).submitText || 'Confirm'}
					cancelText={(dialogState.options as ConfirmOptions).cancelText || 'Cancel'}
					onSubmit={handleConfirmSubmit}
					onCancel={handleConfirmCancel}
				>
					{(dialogState.options as ConfirmOptions).children}
				</ConfirmationDialog>
			)}

			{/* Working Dialog */}
			{dialogState.type === 'working' && dialogState.options && (
				<WorkingDialog
					isOpen={true}
					title={dialogState.options.title}
					message={(dialogState.options as WorkingOptions).message}
				/>
			)}
		</DialogContext.Provider>
	);
};
