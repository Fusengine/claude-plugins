/**
 * Setup interfaces
 */

/** Installs the statusline mod plugin; resolves true on success, never throws */
export type ModInstaller = () => Promise<boolean>;

/** Paths configuration for setup process */
export interface SetupPaths {
	settings: string;
	marketplace: string;
	loaderSrc: string;
	claudeMdSrc: string;
	claudeMdDest: string;
}
